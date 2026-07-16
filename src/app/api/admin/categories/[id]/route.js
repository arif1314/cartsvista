import { ok, fail } from '@/lib/api/response';
import { PRODUCT_MANAGER_ROLES, requireRole } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { slugifyProductName } from '@/lib/validation/product';

function normalizeUpdates(body = {}) {
  const updates = {};
  if (body.name !== undefined || body.title !== undefined) updates.name = String(body.name || body.title || '').trim();
  if (body.slug !== undefined) updates.slug = slugifyProductName(body.slug);
  if (body.parentId !== undefined || body.parent_id !== undefined) updates.parent_id = body.parentId || body.parent_id || null;
  if (body.description !== undefined) updates.description = String(body.description || '').trim() || null;
  if (body.isActive !== undefined || body.is_active !== undefined) updates.is_active = body.isActive ?? body.is_active;
  if (body.sortOrder !== undefined || body.sort_order !== undefined) updates.sort_order = Number(body.sortOrder ?? body.sort_order ?? 0);
  return updates;
}

export async function PATCH(request, context) {
  const auth = await requireRole(request, PRODUCT_MANAGER_ROLES);
  if (auth.error) return fail(auth.error, auth.status);

  const { id } = await context.params;
  const updates = normalizeUpdates(await request.json());
  if (updates.name === '') return fail('Category name is required.', 422);
  if (Object.keys(updates).length === 0) return fail('No category updates supplied.', 422);

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) return fail(error.message, 500);

  await admin.from('audit_logs').insert({
    actor_id: auth.user.id,
    action: 'category.update',
    entity_type: 'category',
    entity_id: data.id,
    metadata: updates,
  });

  return ok({ category: data });
}

export async function DELETE(request, context) {
  const auth = await requireRole(request, PRODUCT_MANAGER_ROLES);
  if (auth.error) return fail(auth.error, auth.status);

  const { id } = await context.params;
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('categories')
    .update({ is_active: false })
    .eq('id', id)
    .select('*')
    .single();

  if (error) return fail(error.message, 500);

  await admin.from('audit_logs').insert({
    actor_id: auth.user.id,
    action: 'category.archive',
    entity_type: 'category',
    entity_id: data.id,
    metadata: { name: data.name },
  });

  return ok({ category: data });
}
