import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { optimizeImageBuffer, optimizedImagePath } from '../src/lib/images/optimizer.js';

const BUCKET = 'product-images';
const TARGET_BYTES = 240 * 1024;

function loadEnv(file) {
  const env = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const index = trimmed.indexOf('=');
    env[trimmed.slice(0, index).trim()] = trimmed
      .slice(index + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
  }
  return env;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function storagePathFromPublicUrl(url) {
  try {
    const parsed = new URL(url);
    const marker = `/storage/v1/object/public/${BUCKET}/`;
    const index = parsed.pathname.indexOf(marker);
    if (index === -1) return null;
    return decodeURIComponent(parsed.pathname.slice(index + marker.length));
  } catch {
    return null;
  }
}

function contentTypeForPath(storagePath) {
  const extension = path.extname(storagePath).toLowerCase();
  if (['.jpg', '.jpeg'].includes(extension)) return 'image/jpeg';
  if (extension === '.png') return 'image/png';
  if (extension === '.webp') return 'image/webp';
  if (extension === '.gif') return 'image/gif';
  if (extension === '.svg') return 'image/svg+xml';
  return 'application/octet-stream';
}

async function main() {
  const env = loadEnv('.env.local');
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: products, error } = await supabase
    .from('products')
    .select('id,name,sku,images')
    .order('created_at', { ascending: true });

  if (error) throw error;

  let scanned = 0;
  let optimizedCount = 0;
  let skipped = 0;
  let failed = 0;
  let originalTotal = 0;
  let outputTotal = 0;

  for (const product of products || []) {
    const nextImages = [];
    let changed = false;

    for (const imageUrl of product.images || []) {
      scanned += 1;
      const sourcePath = storagePathFromPublicUrl(imageUrl);

      if (!sourcePath) {
        skipped += 1;
        nextImages.push(imageUrl);
        continue;
      }

      const sourceType = contentTypeForPath(sourcePath);
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(sourceType)) {
        skipped += 1;
        nextImages.push(imageUrl);
        continue;
      }

      try {
        const { data: blob, error: downloadError } = await supabase.storage
          .from(BUCKET)
          .download(sourcePath);
        if (downloadError) throw downloadError;

        const sourceBuffer = Buffer.from(await blob.arrayBuffer());
        const optimized = await optimizeImageBuffer(sourceBuffer, {
          contentType: blob.type || sourceType,
          targetBytes: TARGET_BYTES,
        });

        originalTotal += optimized.originalBytes;
        outputTotal += optimized.outputBytes;

        if (!optimized.optimized) {
          skipped += 1;
          nextImages.push(imageUrl);
          continue;
        }

        const nextPath = optimizedImagePath(sourcePath);
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(nextPath, optimized.buffer, {
            contentType: optimized.contentType,
            cacheControl: '31536000',
            upsert: true,
          });
        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(nextPath);
        nextImages.push(publicData.publicUrl);
        changed = true;
        optimizedCount += 1;

        if (nextPath !== sourcePath) {
          await supabase.storage.from(BUCKET).remove([sourcePath]);
        }

        console.log(
          `optimized ${product.sku || product.name}: ${formatBytes(optimized.originalBytes)} -> ${formatBytes(optimized.outputBytes)}`
        );
      } catch (itemError) {
        failed += 1;
        nextImages.push(imageUrl);
        console.warn(`failed ${product.sku || product.name}: ${sourcePath} - ${itemError.message}`);
      }
    }

    if (changed) {
      const { error: updateError } = await supabase
        .from('products')
        .update({ images: nextImages })
        .eq('id', product.id);
      if (updateError) throw updateError;
    }
  }

  console.log(JSON.stringify({
    scanned,
    optimized: optimizedCount,
    skipped,
    failed,
    originalTotal: formatBytes(originalTotal),
    outputTotal: formatBytes(outputTotal),
    saved: formatBytes(Math.max(0, originalTotal - outputTotal)),
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
