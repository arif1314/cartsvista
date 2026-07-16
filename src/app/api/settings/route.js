import { ok } from '@/lib/api/response';
import { normalizeShippingSettings } from '@/lib/settings/shipping';
import {
  normalizeInvoiceSettings,
  normalizePaymentSettings,
  publicPaymentSettings,
  normalizeStoreSettings,
  normalizeTaxSettings,
} from '@/lib/settings/store';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export async function GET() {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('store_settings')
    .select('key,value')
    .in('key', ['store', 'payment', 'tax', 'invoice', 'shipping']);

  const map = new Map((data || []).map((row) => [row.key, row.value]));

  return ok({
    settings: {
      store: normalizeStoreSettings(map.get('store')),
      payment: publicPaymentSettings(normalizePaymentSettings(map.get('payment'))),
      tax: normalizeTaxSettings(map.get('tax')),
      invoice: normalizeInvoiceSettings(map.get('invoice')),
      shipping: normalizeShippingSettings(map.get('shipping')),
    },
  });
}
