import { ok, fail } from '@/lib/api/response';
import { queueNotification } from '@/lib/notifications/log';
import { normalizeNotificationSettings } from '@/lib/settings/store';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

function safeText(value, maxLength = 500) {
  return String(value || '').trim().slice(0, maxLength);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const name = safeText(body.name, 120);
    const email = safeText(body.email, 180).toLowerCase();
    const subject = safeText(body.subject || 'Contact inquiry', 180);
    const message = safeText(body.message, 2000);

    const errors = {};
    if (!name) errors.name = 'Name is required.';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'A valid email is required.';
    if (!subject) errors.subject = 'Subject is required.';
    if (!message) errors.message = 'Message is required.';

    if (Object.keys(errors).length > 0) {
      return fail('Invalid contact request.', 422, errors);
    }

    const admin = createSupabaseAdminClient();
    const { data: ticket, error } = await admin
      .from('support_tickets')
      .insert({
        user_id: null,
        user_name: name,
        user_email: email,
        subject,
        message,
        priority: 'normal',
        status: 'Open',
        metadata: { source: 'contact_page' },
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
        channel: 'email',
        recipient: notificationSettings.adminEmail,
        subject: `New contact message: ${subject}`,
        message: `New contact message from ${name} (${email}).`,
        metadata: { ticket_id: ticket.id, notification_type: 'contact_message' },
      });
    }

    return ok({ ticketId: ticket.id }, { status: 201 });
  } catch (error) {
    return fail(error.message || 'Unable to submit contact request.', 500);
  }
}
