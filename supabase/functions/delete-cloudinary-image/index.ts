import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate SHA-1 hex string
async function sha1(message: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { publicIds } = await req.json();

    if (!publicIds || !Array.isArray(publicIds)) {
      return new Response(JSON.stringify({ success: false, error: "publicIds array is required" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME');
    const apiKey = Deno.env.get('CLOUDINARY_API_KEY');
    const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      return new Response(JSON.stringify({ success: false, error: "Missing Cloudinary environment variables" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const deleteResults = [];

    // Delete each image sequentially
    for (const publicId of publicIds) {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      
      // Cloudinary signature: SHA1(public_id=<public_id>&timestamp=<timestamp><api_secret>)
      const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
      const signature = await sha1(stringToSign);

      const formData = new FormData();
      formData.append('public_id', publicId);
      formData.append('timestamp', timestamp);
      formData.append('api_key', apiKey);
      formData.append('signature', signature);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      deleteResults.push({ publicId, result: data.result });
    }

    // Check if any failed
    const allOk = deleteResults.every(r => r.result === 'ok' || r.result === 'not found');

    return new Response(JSON.stringify({ 
      success: allOk, 
      results: deleteResults 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: allOk ? 200 : 500,
    });
  } catch (error) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})
