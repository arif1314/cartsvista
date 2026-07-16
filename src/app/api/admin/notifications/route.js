import { ok, fail } from '@/lib/api/response';
import { ADMIN_ROLES, requireRole } from '@/lib/auth/session';
import { sendNotificationLog } from '@/lib/notifications/send';
import { normalizeNotificationSettings } from '@/lib/settings/store';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

const MAX_BATCH_SIZE = 25;

function serializeNotification(row) {
  return {
    id: row.id,
    userId: row.user_id,
    orderId: row.order_id,
    channel: row.channel,
    recipient: row.recipient || '',
    subject: row.subject || '',
    message: row.message || '',
    status: row.status,
    metadata: row.metadata || {},
    createdAt: row.created_at,
  };
}

async function getNotificationSettings(admin) {
  const { data } = await admin
    .from('store_settings')
    .select('value')
    .eq('key', 'notification')
    .maybeSingle();

  return normalizeNotificationSettings(data?.value);
}

async function processNotification(admin, notification, settings) {
  try {
    const delivery = await sendNotificationLog(notification, settings);
    await admin
      .from('notification_logs')
      .update({
        status: 'sent',
        metadata: {
          ...(notification.metadata || {}),
          provider: delivery.provider,
          provider_id: delivery.providerId,
          delivered_at: new Date().toISOString(),
        },
      })
      .eq('id', notification.id);

    return { id: notification.id, status: 'sent' };
  } catch (error) {
    await admin
      .from('notification_logs')
      .update({
        status: 'failed',
        metadata: {
          ...(notification.metadata || {}),
          error: error.message,
          failed_at: new Date().toISOString(),
        },
      })
      .eq('id', notification.id);

    return { id: notification.id, status: 'failed', error: error.message };
  }
}

export async function GET(request) {
  const auth = await requireRole(request, ADMIN_ROLES);
  if (auth.error) return fail(auth.error, auth.status);

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('notification_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return fail(error.message, 500);

  const settings = await getNotificationSettings(admin);
  return ok({
    notifications: (data || []).map(serializeNotification),
    settings: {
      emailProvider: settings.emailProvider,
      hasResendApiKey: Boolean(settings.resendApiKey),
      emailFrom: settings.emailFrom,
      smsProvider: settings.smsProvider,
      hasTwilioCredentials: Boolean(settings.twilioAccountSid && settings.twilioAuthToken && settings.twilioFromNumber),
    },
  });
}

export async function POST(request) {
  const auth = await requireRole(request, ADMIN_ROLES);
  if (auth.error) return fail(auth.error, auth.status);

  const body = await request.json().catch(() => ({}));
  const admin = createSupabaseAdminClient();
  const settings = await getNotificationSettings(admin);
  const limit = Math.min(MAX_BATCH_SIZE, Math.max(1, Number(body.limit || MAX_BATCH_SIZE)));

  let query = admin
    .from('notification_logs')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (body.action === 'sendOne' && body.id) {
    query = admin
      .from('notification_logs')
      .select('*')
      .eq('id', body.id)
      .limit(1);
  } else if (body.action === 'retryFailed') {
    query = query.eq('status', 'failed');
  } else {
    query = query.eq('status', 'queued');
  }

  const { data, error } = await query;
  if (error) return fail(error.message, 500);

  const results = [];
  for (const notification of data || []) {
    results.push(await processNotification(admin, notification, settings));
  }

  return ok({
    processed: results.length,
    sent: results.filter((result) => result.status === 'sent').length,
    failed: results.filter((result) => result.status === 'failed').length,
    results,
  });
}
