import { ok, fail } from '@/lib/api/response';
import { requireUser } from '@/lib/auth/session';
import { queueNotification } from '@/lib/notifications/log';
import { normalizeNotificationSettings } from '@/lib/settings/store';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export async function POST(request, context) {
  const auth = await requireUser(request);
  if (auth.error) return fail(auth.error, auth.status);

  const { id } = await context.params;
  const body = await request.json();
  const requestType = String(body.requestType || '').toLowerCase();
  const reason = String(body.reason || '').trim().slice(0, 1000);

  if (!['cancel', 'refund'].includes(requestType)) {
    return fail('Request type must be cancel or refund.', 422);
  }

  if (!reason) {
    return fail('Please provide a reason.', 422);
  }

  const admin = createSupabaseAdminClient();
  const { data: order, error: orderError } = await admin
    .from('orders')
    .select('id,user_id,status,total_amount,customer_email')
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .single();

  if (orderError || !order) return fail('Order not found.', 404);

  if (requestType === 'cancel' && !['pending', 'confirmed', 'processing'].includes(order.status)) {
    return fail('This order can no longer be canceled from the customer panel.', 409);
  }

  if (requestType === 'refund' && !['delivered', 'shipped'].includes(order.status)) {
    return fail('Refund requests are available after shipment or delivery.', 409);
  }

  const { data: existingRequest } = await admin
    .from('order_requests')
    .select('id,status')
    .eq('order_id', id)
    .eq('user_id', auth.user.id)
    .eq('request_type', requestType)
    .in('status', ['pending', 'approved'])
    .maybeSingle();

  if (existingRequest) {
    return fail(`A ${requestType} request is already ${existingRequest.status}.`, 409);
  }

  const { data, error } = await admin
    .from('order_requests')
    .insert({
      order_id: id,
      user_id: auth.user.id,
      request_type: requestType,
      reason,
      status: 'pending',
    })
    .select('*')
    .single();

  if (error) return fail(error.message, 500);

  const { data: notificationSetting } = await admin
    .from('store_settings')
    .select('value')
    .eq('key', 'notification')
    .maybeSingle();
  const notificationSettings = normalizeNotificationSettings(notificationSetting?.value);

  if (notificationSettings.adminEmail) {
    await queueNotification(admin, {
      orderId: id,
      channel: 'email',
      recipient: notificationSettings.adminEmail,
      subject: `New ${requestType} request`,
      message: `A customer submitted a ${requestType} request for order ${id.slice(0, 8).toUpperCase()}. Reason: ${reason}`,
      metadata: { request_id: data.id, notification_type: 'order_request_admin_alert' },
    });
  }

  await admin.from('audit_logs').insert({
    actor_id: auth.user.id,
    action: `order.${requestType}_request`,
    entity_type: 'order',
    entity_id: id,
    metadata: { request_id: data.id },
  });

  return ok({ request: data }, { status: 201 });
}
