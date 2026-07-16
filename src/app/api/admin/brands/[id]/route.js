import { ok, fail } from '@/lib/api/response';
import { PRODUCT_MANAGER_ROLES, requireRole } from '@/lib/auth/session';
import { brandToClient } from '@/lib/catalog/format';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { slugifyProductName } from '@/lib/validation/product';

function normalizeUpdates(body = {}) {
  const updates = {};
  if (body.name !== undefined) updates.name = String(body.name || '').trim();
  if (body.slug !== undefined) updates.slug = slugifyProductName(body.slug);
  if (body.logoUrl !== undefined || body.logo_url !== undefined) updates.logo_url = String(body.logoUrl || body.logo_url || '').trim() || null;
  if (body.isActive !== undefined || body.is_active !== undefined) updates.is_active = body.isActive ?? body.is_active;
  return updates;
}

export async function PATCH(request, context) {
  const auth = await requireRole(request, PRODUCT_MANAGER_ROLES);
  if (auth.error) return fail(auth.error, auth.status);

  const { id } = await context.params;
  const updates = normalizeUpdates(await request.json());
  if (updates.name === '') return fail('Brand name is required.', 422);
  if (Object.keys(updates).length === 0) return fail('No brand updates supplied.', 422);

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('brands')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) return fail(error.message, 500);

  await admin.from('audit_logs').insert({
    actor_id: auth.user.id,
    action: 'brand.update',
    entity_type: 'brand',
    entity_id: data.id,
    metadata: updates,
  });

  return ok({ brand: brandToClient(data) });
}

export async function DELETE(request, context) {
  const auth = await requireRole(request, PRODUCT_MANAGER_ROLES);
  if (auth.error) return fail(auth.error, auth.status);

  const { id } = await context.params;
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('brands')
    .update({ is_active: false })
    .eq('id', id)
    .select('*')
    .single();

  if (error) return fail(error.message, 500);

  await admin.from('audit_logs').insert({
    actor_id: auth.user.id,
    action: 'brand.archive',
    entity_type: 'brand',
    entity_id: data.id,
    metadata: { name: data.name },
  });

  return ok({ brand: brandToClient(data) });
}
