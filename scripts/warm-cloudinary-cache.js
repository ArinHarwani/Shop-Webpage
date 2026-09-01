/**
 * DressMirror — Multi-Cloudinary Migration & Cache-Warming Script
 * 
 * Usage:
 *   node scripts/warm-cloudinary-cache.js [options]
 * 
 * Options:
 *   --dry-run          Preview what will be updated without touching DB or Cloudinary
 *   --update-db-only   Only update Supabase image_url & cloudinary_cloud_name
 *   --warm-only        Only ping Cloudinary URLs to trigger Upload Mapping copy
 *   --concurrency <N>  Number of concurrent HTTP requests (default: 8)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Read .env file if available
function loadEnv() {
  const envPath = path.join(rootDir, '.env');
  const envVars = {};
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [key, ...vals] = trimmed.split('=');
      if (key) {
        envVars[key.trim()] = vals.join('=').trim();
      }
    }
  }
  return { ...envVars, ...process.env };
}

const env = loadEnv();

// 2. Cloudinary Accounts & Mapping Config
const DEFAULT_ACCOUNT = env.VITE_CLOUDINARY_FALLBACK_CLOUD_NAME || 'dvdxdqnie';

const ACCOUNT_GROUPS = {
  tops_kurtis: env.VITE_CLOUDINARY_TOPS_KURTIS_CLOUD_NAME || 'jj9xtjbf',
  dresses_onepiece: env.VITE_CLOUDINARY_DRESSES_CLOUD_NAME || 'slvabepb',
  bottoms_shorts: env.VITE_CLOUDINARY_BOTTOMS_CLOUD_NAME || 'dvdxdqnie',
  traditional_other: env.VITE_CLOUDINARY_TRADITIONAL_CLOUD_NAME || 'wzxbak9l',
};

const CATEGORY_MAP = {
  top: ACCOUNT_GROUPS.tops_kurtis,
  kurti: ACCOUNT_GROUPS.tops_kurtis,
  long_dress: ACCOUNT_GROUPS.dresses_onepiece,
  one_piece: ACCOUNT_GROUPS.dresses_onepiece,
  dress: ACCOUNT_GROUPS.dresses_onepiece,
  bottom: ACCOUNT_GROUPS.bottoms_shorts,
  shorts: ACCOUNT_GROUPS.bottoms_shorts,
  denim: ACCOUNT_GROUPS.bottoms_shorts,
  coord_set: ACCOUNT_GROUPS.traditional_other,
  other: ACCOUNT_GROUPS.traditional_other,
  traditional: ACCOUNT_GROUPS.traditional_other,
};

function getTargetCloudName(category) {
  if (!category) return DEFAULT_ACCOUNT;
  const norm = category.toString().trim().toLowerCase();
  return CATEGORY_MAP[norm] || DEFAULT_ACCOUNT;
}

// 3. Command Line Arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isUpdateDbOnly = args.includes('--update-db-only');
const isWarmOnly = args.includes('--warm-only');
const concurrencyArgIdx = args.indexOf('--concurrency');
const concurrency = (concurrencyArgIdx !== -1 && args[concurrencyArgIdx + 1]) 
  ? parseInt(args[concurrencyArgIdx + 1], 10) 
  : 8;

// 4. Supabase Setup
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 5. Concurrency Runner Helper
async function runConcurrent(tasks, limit) {
  const results = [];
  const executing = [];
  for (const task of tasks) {
    const p = Promise.resolve().then(() => task());
    results.push(p);
    if (limit <= tasks.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(results);
}

// 6. Main Execution
async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  DressMirror Multi-Cloudinary Migration & Cache Warmer');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Modes: ${isDryRun ? '[DRY RUN] ' : ''}${isUpdateDbOnly ? '[DB ONLY] ' : ''}${isWarmOnly ? '[WARM ONLY] ' : 'FULL (DB Update + Cache Warm)'}`);
  console.log(`Account Mapping:`);
  console.log(`  • Tops & Kurtis (Group 1)       -> ${ACCOUNT_GROUPS.tops_kurtis}`);
  console.log(`  • Dresses & One Piece (Group 2) -> ${ACCOUNT_GROUPS.dresses_onepiece}`);
  console.log(`  • Bottoms & Shorts (Group 3)    -> ${ACCOUNT_GROUPS.bottoms_shorts}`);
  console.log(`  • Traditional & Other (Group 4) -> ${ACCOUNT_GROUPS.traditional_other}`);
  console.log(`  • Fallback / Legacy             -> ${DEFAULT_ACCOUNT}`);
  console.log('───────────────────────────────────────────────────────────────\n');

  // Fetch Items & Variants
  console.log('⏳ Fetching catalog items and variants from Supabase...');
  const { data: items, error: itemsError } = await supabase.from('items').select('id, name, type, item_code');
  if (itemsError) {
    console.error('❌ Failed to fetch items:', itemsError);
    process.exit(1);
  }

  const { data: variants, error: variantsError } = await supabase.from('item_variants').select('*');
  if (variantsError) {
    console.error('❌ Failed to fetch item_variants:', variantsError);
    process.exit(1);
  }

  console.log(`✓ Retrieved ${items.length} items and ${variants.length} variants.\n`);

  const itemMap = new Map(items.map(i => [i.id, i]));
  const migrationItems = [];

  for (const variant of variants) {
    const item = itemMap.get(variant.item_id);
    const category = item?.type || 'other';
    const targetCloudName = getTargetCloudName(category);

    let filename = '';
    if (variant.image_url && variant.image_url.includes('res.cloudinary.com')) {
      const clean = variant.image_url.split('?')[0];
      filename = clean.split('/').pop();
    } else if (variant.cloudinary_public_id) {
      filename = variant.cloudinary_public_id.split('/').pop();
      if (!filename.includes('.')) {
        filename += '.png';
      }
    }

    if (!filename) continue;

    // Construct target URL
    let targetUrl = '';
    let targetPublicId = '';

    if (targetCloudName === DEFAULT_ACCOUNT) {
      targetUrl = `https://res.cloudinary.com/${targetCloudName}/image/upload/${filename}`;
      targetPublicId = filename.replace(/\.[^/.]+$/, '');
    } else {
      targetUrl = `https://res.cloudinary.com/${targetCloudName}/image/upload/shop-products/${filename}`;
      targetPublicId = `shop-products/${filename.replace(/\.[^/.]+$/, '')}`;
    }

    const needsDbUpdate = variant.image_url !== targetUrl || variant.cloudinary_cloud_name !== targetCloudName;

    migrationItems.push({
      variantId: variant.id,
      itemId: variant.item_id,
      itemCode: item?.item_code || 'N/A',
      itemName: item?.name || 'Unknown',
      category,
      colourName: variant.colour_name,
      currentUrl: variant.image_url,
      currentCloudName: variant.cloudinary_cloud_name || 'dvdxdqnie',
      targetCloudName,
      targetUrl,
      targetPublicId,
      filename,
      needsDbUpdate,
    });
  }

  // Statistics
  const stats = {
    total: migrationItems.length,
    byAccount: {},
    dbUpdated: 0,
    warmSuccess: 0,
    warmSkipped: 0,
    warmFailed: 0,
  };

  for (const m of migrationItems) {
    stats.byAccount[m.targetCloudName] = (stats.byAccount[m.targetCloudName] || 0) + 1;
  }

  console.log('Distribution across target Cloudinary accounts:');
  for (const [account, count] of Object.entries(stats.byAccount)) {
    console.log(`  - ${account.padEnd(25)} : ${count} variants`);
  }
  console.log();

  // Phase 1: Database Backfill (image_url & cloudinary_cloud_name)
  if (!isWarmOnly) {
    console.log('───────────────────────────────────────────────────────────────');
    console.log('Phase 1: Updating Supabase records with target Cloudinary URLs...');
    console.log('───────────────────────────────────────────────────────────────');

    const toUpdate = migrationItems.filter(m => m.needsDbUpdate);
    console.log(`Found ${toUpdate.length} variant(s) requiring DB update.`);

    if (!isDryRun && toUpdate.length > 0) {
      for (let i = 0; i < toUpdate.length; i++) {
        const item = toUpdate[i];
        
        // Update image_url (and cloudinary_cloud_name if column exists)
        const updatePayload = {
          image_url: item.targetUrl,
        };

        const { error } = await supabase
          .from('item_variants')
          .update(updatePayload)
          .eq('id', item.variantId);

        if (error) {
          console.error(`  ❌ Failed to update variant ${item.variantId}:`, error.message);
        } else {
          stats.dbUpdated++;
        }

        if ((i + 1) % 50 === 0 || i === toUpdate.length - 1) {
          process.stdout.write(`  Updated ${i + 1}/${toUpdate.length} rows in Supabase...\r`);
        }
      }
      console.log(`\n✓ Database update complete. Updated ${stats.dbUpdated} records.\n`);
    } else if (isDryRun) {
      console.log(`[DRY RUN] Would update ${toUpdate.length} rows in item_variants.`);
    }
  }

  // Phase 2: Cache Warming via Upload Mapping
  if (!isUpdateDbOnly) {
    console.log('───────────────────────────────────────────────────────────────');
    console.log('Phase 2: Cache Warming (Triggering Cloudinary Upload Mapping)');
    console.log('───────────────────────────────────────────────────────────────');

    console.log(`Warming ${migrationItems.length} images (Concurrency: ${concurrency})...\n`);

    if (isDryRun) {
      console.log(`[DRY RUN] Sample target URLs that will be pinged to trigger auto-copy:`);
      migrationItems.slice(0, 8).forEach(item => {
        console.log(`  [${item.category.padEnd(10)}] (${item.targetCloudName}) -> ${item.targetUrl}`);
      });
      console.log(`\n[DRY RUN] Finished preview.`);
      return;
    }

    let completed = 0;
    const tasks = migrationItems.map(item => async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);
        const res = await fetch(item.targetUrl, { method: 'GET', signal: controller.signal });
        clearTimeout(timeout);

        completed++;
        if (res.ok) {
          stats.warmSuccess++;
          if (completed % 25 === 0 || completed === migrationItems.length) {
            console.log(`  [${completed}/${migrationItems.length}] ✓ Warmed: ${item.itemCode} (${item.targetCloudName}) [${res.status}]`);
          }
        } else {
          stats.warmFailed++;
          console.warn(`  [${completed}/${migrationItems.length}] ⚠️ HTTP ${res.status}: ${item.itemCode} -> ${item.targetUrl}`);
        }
      } catch (err) {
        completed++;
        stats.warmFailed++;
        console.error(`  [${completed}/${migrationItems.length}] ❌ Error: ${item.itemCode} -> ${err.message}`);
      }
    });

    await runConcurrent(tasks, concurrency);
    console.log('\n✓ Cache warming complete.');
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  Migration Summary');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Total Variants Processed : ${stats.total}`);
  console.log(`Database Rows Updated    : ${stats.dbUpdated}`);
  console.log(`Images Cache-Warmed (200): ${stats.warmSuccess}`);
  console.log(`Images Failed / Timeout  : ${stats.warmFailed}`);
  console.log('═══════════════════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
