import { ok, fail } from '@/lib/api/response';
import { PRODUCT_MANAGER_ROLES, requireRole } from '@/lib/auth/session';
import { createSupabaseAdminClient, createSupabaseServerClient, hasServiceRoleKey } from '@/lib/supabase/server';
import { slugifyProductName } from '@/lib/validation/product';

const BUCKET = 'product-images';
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

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
  return 'jpg';
}

export async function POST(request) {
  const auth = await requireRole(request, PRODUCT_MANAGER_ROLES);
  if (auth.error) return fail(auth.error, auth.status);

  const formData = await request.formData();
  const files = formData.getAll('files').filter((file) => file?.arrayBuffer);
  const productName = String(formData.get('productName') || 'product').trim();

  if (files.length === 0) {
    return fail('No image files were uploaded.', 422);
  }

  const admin = createSupabaseAdminClient();
  const storageClient = hasServiceRoleKey()
    ? admin
    : createSupabaseServerClient(auth.accessToken);

  if (hasServiceRoleKey()) {
    await ensureBucket(admin);
  }

  const uploaded = [];
  for (const file of files) {
    if (!ALLOWED_TYPES.has(file.type)) {
      return fail('Only JPG, PNG, WEBP, and GIF images are allowed.', 422);
    }

    if (file.size > MAX_FILE_SIZE) {
      return fail('Each image must be 5MB or smaller.', 422);
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const safeName = slugifyProductName(productName) || 'product';
    const path = `${safeName}/${Date.now()}-${crypto.randomUUID()}.${extensionFor(file)}`;
    const { error } = await storageClient.storage.from(BUCKET).upload(path, bytes, {
      cacheControl: '31536000',
      contentType: file.type,
      upsert: false,
    });

    if (error) return fail(error.message, 500);

    const { data } = storageClient.storage.from(BUCKET).getPublicUrl(path);
    uploaded.push({
      path,
      url: data.publicUrl,
      name: file.name,
      size: file.size,
      type: file.type,
    });
  }

  await admin.from('audit_logs').insert({
    actor_id: auth.user.id,
    action: 'product.images.upload',
    entity_type: 'storage',
    entity_id: BUCKET,
    metadata: { count: uploaded.length, product_name: productName },
  });

  return ok({ images: uploaded }, { status: 201 });
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
    action: 'product.images.delete',
    entity_type: 'storage',
    entity_id: BUCKET,
    metadata: { path },
  });

  return ok({ path });
}
