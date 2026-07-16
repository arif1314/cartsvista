import { ok, fail } from '@/lib/api/response';
import { PRODUCT_MANAGER_ROLES, requireRole } from '@/lib/auth/session';
import { normalizeShippingSettings } from '@/lib/settings/shipping';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export async function GET(request) {
  const auth = await requireRole(request, PRODUCT_MANAGER_ROLES);
  if (auth.error) return fail(auth.error, auth.status);

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('store_settings')
    .select('value')
    .eq('key', 'shipping')
    .single();

  if (error) return fail(error.message, 500);

  return ok({ settings: normalizeShippingSettings(data?.value) });
}

export async function PATCH(request) {
  const auth = await requireRole(request, PRODUCT_MANAGER_ROLES);
  if (auth.error) return fail(auth.error, auth.status);

  const body = await request.json();
  const settings = normalizeShippingSettings(body);

  if (
    settings.defaultShippingAmount < 0 ||
    settings.freeShippingThreshold < 0 ||
    settings.insideDhakaAmount < 0 ||
    settings.outsideDhakaAmount < 0
  ) {
    return fail('Shipping settings must be valid positive numbers.', 422);
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('store_settings')
    .upsert({ key: 'shipping', value: settings }, { onConflict: 'key' })
    .select('value')
    .single();

  if (error) return fail(error.message, 500);

  await admin.from('audit_logs').insert({
    actor_id: auth.user.id,
    action: 'settings.shipping.update',
    entity_type: 'store_settings',
    entity_id: 'shipping',
    metadata: settings,
  });

  return ok({ settings: normalizeShippingSettings(data?.value) });
}
