import { ok, fail } from '@/lib/api/response';
import { PRODUCT_MANAGER_ROLES, requireRole } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { normalizeCouponPayload } from '@/lib/validation/coupon';

export async function PATCH(request, context) {
  const auth = await requireRole(request, PRODUCT_MANAGER_ROLES);
  if (auth.error) return fail(auth.error, auth.status);

  const { id } = await context.params;
  const body = await request.json();
  const { coupon, errors, isValid } = normalizeCouponPayload(body);

  if (!isValid) {
    return fail('Invalid coupon data.', 422, errors);
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('coupons')
    .update(coupon)
    .eq('id', id)
    .select('*')
    .single();

  if (error) return fail(error.message, 500);

  await admin.from('audit_logs').insert({
    actor_id: auth.user.id,
    action: 'coupon.update',
    entity_type: 'coupon',
    entity_id: data.id,
    metadata: { code: data.code },
  });

  return ok({ coupon: data });
}

export async function DELETE(request, context) {
  const auth = await requireRole(request, PRODUCT_MANAGER_ROLES);
  if (auth.error) return fail(auth.error, auth.status);

  const { id } = await context.params;
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('coupons')
    .update({ is_active: false })
    .eq('id', id)
    .select('*')
    .single();

  if (error) return fail(error.message, 500);

  await admin.from('audit_logs').insert({
    actor_id: auth.user.id,
    action: 'coupon.archive',
    entity_type: 'coupon',
    entity_id: data.id,
    metadata: { code: data.code },
  });

  return ok({ coupon: data });
}
