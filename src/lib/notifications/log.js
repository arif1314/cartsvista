import { formatCurrency } from '@/lib/format/currency';

export async function queueNotification(admin, {
  userId = null,
  orderId = null,
  channel = 'email',
  recipient = '',
  subject = '',
  message,
  metadata = {},
}) {
  if (!message) return { data: null, error: null };

  return admin.from('notification_logs').insert({
    user_id: userId,
    order_id: orderId,
    channel,
    recipient,
    subject,
    message,
    metadata,
    status: 'queued',
  });
}

export function orderConfirmationMessage(orderId, totalAmount) {
  return `Your CartsVista order ${String(orderId).slice(0, 8).toUpperCase()} has been received. Total amount: ${formatCurrency(totalAmount)}.`;
}
