import { ok, fail } from '@/lib/api/response';
import { PRODUCT_MANAGER_ROLES, requireRole } from '@/lib/auth/session';
import {
  normalizeInvoiceSettings,
  normalizeNotificationSettings,
  normalizePaymentSettings,
  normalizeStoreSettings,
  normalizeTaxSettings,
} from '@/lib/settings/store';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

const SETTING_KEYS = ['store', 'payment', 'tax', 'invoice', 'notification'];

function normalizeSettings(key, value) {
  if (key === 'store') return normalizeStoreSettings(value);
  if (key === 'payment') return normalizePaymentSettings(value);
  if (key === 'tax') return normalizeTaxSettings(value);
  if (key === 'invoice') return normalizeInvoiceSettings(value);
  if (key === 'notification') return normalizeNotificationSettings(value);
  return value || {};
}

function settingsMap(rows = []) {
  const map = new Map(rows.map((row) => [row.key, row.value]));
  return SETTING_KEYS.reduce((acc, key) => {
    acc[key] = normalizeSettings(key, map.get(key));
    return acc;
  }, {});
}

export async function GET(request) {
  const auth = await requireRole(request, PRODUCT_MANAGER_ROLES);
  if (auth.error) return fail(auth.error, auth.status);

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('store_settings')
    .select('key,value')
    .in('key', SETTING_KEYS);

  if (error) return fail(error.message, 500);

  return ok({ settings: settingsMap(data || []) });
}

export async function PATCH(request) {
  const auth = await requireRole(request, PRODUCT_MANAGER_ROLES);
  if (auth.error) return fail(auth.error, auth.status);

  const body = await request.json();
  const rows = SETTING_KEYS
    .filter((key) => body[key] !== undefined)
    .map((key) => ({
      key,
      value: normalizeSettings(key, body[key]),
    }));

  if (rows.length === 0) {
    return fail('No settings supplied.', 422);
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('store_settings')
    .upsert(rows, { onConflict: 'key' })
    .select('key,value');

  if (error) return fail(error.message, 500);

  await admin.from('audit_logs').insert({
    actor_id: auth.user.id,
    action: 'settings.store.update',
    entity_type: 'store_settings',
    entity_id: 'general',
    metadata: rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {}),
  });

  return ok({ settings: settingsMap(data || []) });
}
