import { ok, fail } from '@/lib/api/response';
import { ADMIN_ROLES, PRODUCT_MANAGER_ROLES, requireRole } from '@/lib/auth/session';
import { orderToClient } from '@/lib/format/order';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'canceled', 'refunded'];
const PAYMENT_STATUSES = ['unpaid', 'pending', 'paid', 'failed', 'refunded'];

export async function GET(request, context) {
  const auth = await requireRole(request, ADMIN_ROLES);
  if (auth.error) return fail(auth.error, auth.status);

  const { id } = await context.params;
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('orders')
    .select('*, order_items(*, products(images)), order_requests(*), payments(*), notification_logs(*), order_status_events(*)')
    .eq('id', id)
    .single();

  if (error || !data) return fail('Order not found.', 404);
  return ok({ order: orderToClient(data) });
}

export async function PATCH(request, context) {
  const auth = await requireRole(request, PRODUCT_MANAGER_ROLES);
  if (auth.error) return fail(auth.error, auth.status);

  const { id } = await context.params;
  const body = await request.json();
  const updates = {};
  const status = body.status ? String(body.status).toLowerCase() : null;
  const paymentStatus = body.paymentStatus ? String(body.paymentStatus).toLowerCase() : null;

  if (status && !ORDER_STATUSES.includes(status)) {
    return fail('Invalid order status.', 422);
  }

  if (paymentStatus && !PAYMENT_STATUSES.includes(paymentStatus)) {
    return fail('Invalid payment status.', 422);
  }

  if (status) updates.status = status;
  if (paymentStatus) updates.payment_status = paymentStatus;

  if (Object.keys(updates).length === 0) {
    return fail('No valid update supplied.', 422);
  }

  const admin = createSupabaseAdminClient();
  const { data: existingOrder } = await admin
    .from('orders')
    .select('status,payment_status')
    .eq('id', id)
    .single();

  const { data, error } = await admin
    .from('orders')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) return fail(error.message, 500);

  if (status && existingOrder?.status !== status) {
    await admin.from('order_status_events').insert({
      order_id: id,
      actor_id: auth.user.id,
      event_type: 'order.status_update',
      from_status: existingOrder?.status || null,
      to_status: status,
      note: body.note || `Order status updated to ${status}.`,
      metadata: { payment_status: paymentStatus || existingOrder?.payment_status || data.payment_status },
    });
  }

  if (paymentStatus) {
    const { data: payment } = await admin
      .from('payments')
      .select('*')
      .eq('order_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (payment) {
      await admin
        .from('payments')
        .update({ status: paymentStatus })
        .eq('id', payment.id);

      await admin.from('payment_events').insert({
        payment_id: payment.id,
        order_id: id,
        event_type: 'payment.status_update',
        provider: payment.provider,
        provider_reference: payment.provider_reference,
        status: paymentStatus,
        raw_payload: { updated_by: auth.user.id },
      });
    }
  }

  await admin.from('audit_logs').insert({
    actor_id: auth.user.id,
    action: 'order.status_update',
    entity_type: 'order',
    entity_id: data.id,
    metadata: updates,
  });

  return ok({ order: data });
}
