import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate SHA-1 hex string
async function sha1(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

interface AccountCredentials {
  apiKey: string;
  apiSecret: string;
}

/**
 * Helper to resolve API credentials for a given cloudName
 */
function getCredentialsForCloud(cloudName: string): AccountCredentials | null {
  // 1. Try reading from CLOUDINARY_ACCOUNTS_CONFIG JSON environment variable
  const rawAccountsConfig = Deno.env.get('CLOUDINARY_ACCOUNTS_CONFIG');
  if (rawAccountsConfig) {
    try {
      const accounts = JSON.parse(rawAccountsConfig);
      if (accounts[cloudName] && accounts[cloudName].apiKey && accounts[cloudName].apiSecret) {
        return {
          apiKey: accounts[cloudName].apiKey,
          apiSecret: accounts[cloudName].apiSecret,
        };
      }
    } catch (e) {
      console.warn("Failed to parse CLOUDINARY_ACCOUNTS_CONFIG JSON:", e);
    }
  }

  // 2. Try per-account sanitized environment variables: CLOUDINARY_<CLOUDNAME>_API_KEY / _API_SECRET
  const sanitized = cloudName.toUpperCase().replace(/[^A-Z0-9]/g, '_');
  const accountApiKey = Deno.env.get(`CLOUDINARY_${sanitized}_API_KEY`);
  const accountApiSecret = Deno.env.get(`CLOUDINARY_${sanitized}_API_SECRET`);
  if (accountApiKey && accountApiSecret) {
    return { apiKey: accountApiKey, apiSecret: accountApiSecret };
  }

  // 3. Fallback to default single-account environment variables
  const defaultApiKey = Deno.env.get('CLOUDINARY_API_KEY');
  const defaultApiSecret = Deno.env.get('CLOUDINARY_API_SECRET');
  if (defaultApiKey && defaultApiSecret) {
    return { apiKey: defaultApiKey, apiSecret: defaultApiSecret };
  }

  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const defaultCloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME') || 'dvdxdqnie';

    // Parse deletion targets: supports both [{ publicId, cloudName }] and legacy [publicId1, publicId2]
    let itemsToDelete: Array<{ publicId: string; cloudName: string }> = [];

    if (body.items && Array.isArray(body.items)) {
      itemsToDelete = body.items.map((item: any) => ({
        publicId: item.publicId || item.image_public_id,
        cloudName: item.cloudName || item.cloudinary_cloud_name || defaultCloudName,
      })).filter((i: any) => Boolean(i.publicId));
    } else if (body.publicIds && Array.isArray(body.publicIds)) {
      itemsToDelete = body.publicIds.map((pid: string) => ({
        publicId: pid,
        cloudName: body.cloudName || defaultCloudName,
      })).filter((i: any) => Boolean(i.publicId));
    }

    if (itemsToDelete.length === 0) {
      return new Response(JSON.stringify({ success: true, results: [], message: "No publicIds provided" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const deleteResults = [];

    // Process deletions
    for (const { publicId, cloudName } of itemsToDelete) {
      const creds = getCredentialsForCloud(cloudName);

      if (!creds) {
        console.error(`Missing credentials for Cloudinary cloud: "${cloudName}"`);
        deleteResults.push({
          publicId,
          cloudName,
          result: 'error',
          error: `Missing API credentials for cloud "${cloudName}"`,
        });
        continue;
      }

      const timestamp = Math.floor(Date.now() / 1000).toString();
      const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${creds.apiSecret}`;
      const signature = await sha1(stringToSign);

      const formData = new FormData();
      formData.append('public_id', publicId);
      formData.append('timestamp', timestamp);
      formData.append('api_key', creds.apiKey);
      formData.append('signature', signature);

      try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        deleteResults.push({
          publicId,
          cloudName,
          result: data.result || 'error',
          details: data,
        });
      } catch (err: any) {
        console.error(`Error deleting image ${publicId} from ${cloudName}:`, err);
        deleteResults.push({
          publicId,
          cloudName,
          result: 'error',
          error: err.message || 'Fetch failed',
        });
      }
    }

    // Check if all deletions succeeded (ok or not found)
    const allOk = deleteResults.every(r => r.result === 'ok' || r.result === 'not found');

    return new Response(JSON.stringify({ 
      success: allOk, 
      results: deleteResults 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: allOk ? 200 : 207, // 207 Multi-Status if partial failure
    });
  } catch (error: any) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})
