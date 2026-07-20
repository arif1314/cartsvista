import { ok, fail } from '@/lib/api/response';
import { PRODUCT_MANAGER_ROLES, requireRole } from '@/lib/auth/session';
import { optimizeImageBuffer } from '@/lib/images/optimizer';
import { createSupabaseAdminClient, createSupabaseServerClient, hasServiceRoleKey } from '@/lib/supabase/server';
import { slugifyProductName } from '@/lib/validation/product';

const BUCKET = 'product-images';
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']);

async function ensureBucket(admin) {
  const { data } = await admin.storage.getBucket(BUCKET);
  if (data) return;

  await admin.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: MAX_FILE_SIZE,
    allowedMimeTypes: Array.from(ALLOWED_TYPES),
  });
}

function extensionFor(file) {
  const fromName = file.name?.split('.').pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName;
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  if (file.type === 'image/gif') return 'gif';
  if (file.type === 'image/svg+xml') return 'svg';
  return 'jpg';
}

function isStorageFile(item) {
  return Boolean(item.id || item.metadata?.size || item.updated_at || item.created_at);
}

async function listFiles(storageClient, prefix = '') {
  const { data, error } = await storageClient.storage.from(BUCKET).list(prefix, {
    limit: 1000,
    sortBy: { column: 'created_at', order: 'desc' },
  });

  if (error) throw error;

  const files = [];
  for (const item of data || []) {
    const path = prefix ? `${prefix}/${item.name}` : item.name;
    if (isStorageFile(item)) {
      const { data: urlData } = storageClient.storage.from(BUCKET).getPublicUrl(path);
      files.push({
        path,
        url: urlData.publicUrl,
        name: item.name,
        size: Number(item.metadata?.size || 0),
        type: item.metadata?.mimetype || item.metadata?.mimeType || '',
        createdAt: item.created_at || item.updated_at || null,
      });
    } else {
      files.push(...await listFiles(storageClient, path));
    }
  }

  return files;
}

export async function GET(request) {
  const auth = await requireRole(request, PRODUCT_MANAGER_ROLES);
  if (auth.error) return fail(auth.error, auth.status);

  const admin = createSupabaseAdminClient();
  const storageClient = hasServiceRoleKey()
    ? admin
    : createSupabaseServerClient(auth.accessToken);

  try {
    if (hasServiceRoleKey()) await ensureBucket(admin);
    const files = await listFiles(storageClient);
    return ok({ files });
  } catch (error) {
    return fail(error.message || 'Unable to load image library.', 500);
  }
}

export async function POST(request) {
  const auth = await requireRole(request, PRODUCT_MANAGER_ROLES);
  if (auth.error) return fail(auth.error, auth.status);

  const formData = await request.formData();
  const files = formData.getAll('files').filter((file) => file?.arrayBuffer);
  const folder = slugifyProductName(formData.get('folder') || 'library') || 'library';

  if (files.length === 0) return fail('No image files were uploaded.', 422);

  const admin = createSupabaseAdminClient();
  const storageClient = hasServiceRoleKey()
    ? admin
    : createSupabaseServerClient(auth.accessToken);

  if (hasServiceRoleKey()) await ensureBucket(admin);

  const uploaded = [];
  for (const file of files) {
    if (!ALLOWED_TYPES.has(file.type)) {
      return fail('Only JPG, PNG, WEBP, GIF, and SVG images are allowed.', 422);
    }

    if (file.size > MAX_FILE_SIZE) {
      return fail('Each image must be 5MB or smaller.', 422);
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const optimized = await optimizeImageBuffer(bytes, {
      contentType: file.type,
      targetBytes: 260 * 1024,
    });
    const path = `${folder}/${Date.now()}-${crypto.randomUUID()}.${optimized.extension || extensionFor(file)}`;
    const { error } = await storageClient.storage.from(BUCKET).upload(path, optimized.buffer, {
      cacheControl: '31536000',
      contentType: optimized.contentType || file.type,
      upsert: false,
    });

    if (error) return fail(error.message, 500);

    const { data } = storageClient.storage.from(BUCKET).getPublicUrl(path);
    uploaded.push({
      path,
      url: data.publicUrl,
      name: file.name,
      size: optimized.outputBytes,
      originalSize: file.size,
      type: optimized.contentType || file.type,
      optimized: optimized.optimized,
      createdAt: new Date().toISOString(),
    });
  }

  await admin.from('audit_logs').insert({
    actor_id: auth.user.id,
    action: 'media.upload',
    entity_type: 'storage',
    entity_id: BUCKET,
    metadata: { count: uploaded.length, folder },
  });

  return ok({ files: uploaded }, { status: 201 });
}

export async function DELETE(request) {
  const auth = await requireRole(request, PRODUCT_MANAGER_ROLES);
  if (auth.error) return fail(auth.error, auth.status);

  const body = await request.json();
  const path = String(body.path || '').trim();
  if (!path) return fail('Image path is required.', 422);

  const admin = createSupabaseAdminClient();
  const storageClient = hasServiceRoleKey()
    ? admin
    : createSupabaseServerClient(auth.accessToken);

  const { error } = await storageClient.storage.from(BUCKET).remove([path]);
  if (error) return fail(error.message, 500);

  await admin.from('audit_logs').insert({
    actor_id: auth.user.id,
    action: 'media.delete',
    entity_type: 'storage',
    entity_id: BUCKET,
    metadata: { path },
  });

  return ok({ path });
}
