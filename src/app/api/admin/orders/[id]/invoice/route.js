import { ok, fail } from '@/lib/api/response';
import { ADMIN_ROLES, requireRole } from '@/lib/auth/session';
import { orderToClient } from '@/lib/format/order';
import { normalizeInvoiceSettings, normalizeStoreSettings, normalizeTaxSettings } from '@/lib/settings/store';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export async function GET(request, context) {
  const auth = await requireRole(request, ADMIN_ROLES);
  if (auth.error) return fail(auth.error, auth.status);

  const { id } = await context.params;
  const admin = createSupabaseAdminClient();
  const [{ data, error }, { data: settingsRows }] = await Promise.all([
    admin
      .from('orders')
      .select('*, order_items(*, products(images)), payments(*)')
      .eq('id', id)
      .single(),
    admin
      .from('store_settings')
      .select('key,value')
      .in('key', ['store', 'invoice', 'tax']),
  ]);

  if (error || !data) return fail('Invoice not found.', 404);
  const settingsMap = new Map((settingsRows || []).map((row) => [row.key, row.value]));
  return ok({
    invoice: orderToClient(data),
    settings: {
      store: normalizeStoreSettings(settingsMap.get('store')),
      invoice: normalizeInvoiceSettings(settingsMap.get('invoice')),
      tax: normalizeTaxSettings(settingsMap.get('tax')),
    },
  });
}
