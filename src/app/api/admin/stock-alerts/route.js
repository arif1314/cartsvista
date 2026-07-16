import { ok, fail } from '@/lib/api/response';
import { ADMIN_ROLES, requireRole } from '@/lib/auth/session';
import { queueNotification } from '@/lib/notifications/log';
import { normalizeNotificationSettings } from '@/lib/settings/store';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export async function POST(request) {
  const auth = await requireRole(request, ADMIN_ROLES);
  if (auth.error) return fail(auth.error, auth.status);

  const body = await request.json().catch(() => ({}));
  const threshold = Math.min(50, Math.max(0, Number(body.threshold || 5)));
  const admin = createSupabaseAdminClient();

  const { data: notificationSetting } = await admin
    .from('store_settings')
    .select('value')
    .eq('key', 'notification')
    .maybeSingle();
  const notificationSettings = normalizeNotificationSettings(notificationSetting?.value);

  if (!notificationSettings.adminEmail) {
    return fail('Admin notification email is not configured.', 422);
  }

  const { data: products, error } = await admin
    .from('products')
    .select('id,name,sku,stock')
    .neq('status', 'archived')
    .lte('stock', threshold)
    .order('stock', { ascending: true })
    .limit(30);

  if (error) return fail(error.message, 500);
  if (!products || products.length === 0) {
    return ok({ queued: 0, message: 'No low-stock products found.' });
  }

  const productLines = products
    .map((product) => `- ${product.name}${product.sku ? ` (${product.sku})` : ''}: ${Number(product.stock || 0)} left`)
    .join('\n');

  const { data: notification, error: notificationError } = await queueNotification(admin, {
    channel: 'email',
    recipient: notificationSettings.adminEmail,
    subject: `Low stock alert: ${products.length} products need attention`,
    message: `The following products are at or below ${threshold} stock:\n\n${productLines}`,
    metadata: {
      notification_type: 'low_stock_alert',
      threshold,
      product_ids: products.map((product) => product.id),
    },
  });

  if (notificationError) return fail(notificationError.message, 500);

  await admin.from('audit_logs').insert({
    actor_id: auth.user.id,
    action: 'inventory.low_stock_alert',
    entity_type: 'notification_log',
    entity_id: notification?.[0]?.id || null,
    metadata: { threshold, product_count: products.length },
  });

  return ok({ queued: products.length, message: 'Low-stock alert queued for admin email.' });
}
