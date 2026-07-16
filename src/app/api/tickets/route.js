import { ok, fail } from '@/lib/api/response';
import { ADMIN_ROLES, requireRole, requireUser } from '@/lib/auth/session';
import { queueNotification } from '@/lib/notifications/log';
import { normalizeNotificationSettings } from '@/lib/settings/store';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

const TICKET_STATUSES = ['Open', 'Replied', 'Closed'];
const TICKET_PRIORITIES = ['low', 'normal', 'high', 'urgent'];

function isStaffRole(role) {
  return ADMIN_ROLES.includes(role);
}

function ticketToClient(ticket, replies = [], notes = [], includePrivate = false) {
  return {
    id: ticket.id,
    userId: ticket.user_id,
    assignedTo: ticket.assigned_to || '',
    orderId: ticket.order_id || '',
    userName: ticket.user_name,
    userEmail: ticket.user_email,
    subject: ticket.subject,
    message: ticket.message,
    status: ticket.status,
    priority: ticket.priority || 'normal',
    metadata: ticket.metadata || {},
    createdAt: ticket.created_at,
    updatedAt: ticket.updated_at,
    replies: replies.map((reply) => ({
      id: reply.id,
      author: reply.author_role,
      message: reply.message,
      createdAt: reply.created_at,
    })),
    internalNotes: includePrivate
      ? notes.map((note) => ({
        id: note.id,
        note: note.note,
        createdAt: note.created_at,
        authorId: note.author_id,
      }))
      : [],
  };
}

async function loadRows(table, ticketIds) {
  if (ticketIds.length === 0) return new Map();

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from(table)
    .select('*')
    .in('ticket_id', ticketIds)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data || []).reduce((map, row) => {
    const rows = map.get(row.ticket_id) || [];
    rows.push(row);
    map.set(row.ticket_id, rows);
    return map;
  }, new Map());
}

async function getNotificationSettings(admin) {
  const { data } = await admin
    .from('store_settings')
    .select('value')
    .eq('key', 'notification')
    .maybeSingle();

  return normalizeNotificationSettings(data?.value);
}

export async function GET(request) {
  const context = await requireUser(request);
  if (context.error) return fail(context.error, context.status);

  const admin = createSupabaseAdminClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const includeClosed = searchParams.get('includeClosed') !== 'false';
  const staff = isStaffRole(context.role);

  let query = admin
    .from('support_tickets')
    .select('*')
    .order('updated_at', { ascending: false });

  if (!staff) {
    query = query.eq('user_id', context.user.id);
  }

  if (status && TICKET_STATUSES.includes(status)) {
    query = query.eq('status', status);
  } else if (!includeClosed) {
    query = query.neq('status', 'Closed');
  }

  const { data, error } = await query;
  if (error) return fail(error.message, 500);

  const ticketIds = (data || []).map((ticket) => ticket.id);
  const [repliesByTicket, notesByTicket] = await Promise.all([
    loadRows('ticket_replies', ticketIds),
    staff ? loadRows('support_ticket_notes', ticketIds) : Promise.resolve(new Map()),
  ]);
  const tickets = (data || []).map((ticket) =>
    ticketToClient(
      ticket,
      repliesByTicket.get(ticket.id) || [],
      notesByTicket.get(ticket.id) || [],
      staff
    )
  );

  return ok({ tickets });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const action = body.action || 'create';
    const admin = createSupabaseAdminClient();

    if (action === 'reply') {
      const context = await requireUser(request);
      if (context.error) return fail(context.error, context.status);

      const ticketId = String(body.ticketId || '').trim();
      const replyMessage = String(body.replyMessage || '').trim();
      if (!ticketId || !replyMessage) {
        return fail('Ticket ID and reply message are required.', 422);
      }

      const { data: ticket, error: ticketError } = await admin
        .from('support_tickets')
        .select('*')
        .eq('id', ticketId)
        .single();

      if (ticketError || !ticket) return fail('Ticket not found.', 404);

      const staff = isStaffRole(context.role);
      if (!staff && ticket.user_id !== context.user.id) {
        return fail('Permission denied.', 403);
      }

      if (ticket.status === 'Closed') {
        return fail('This ticket is closed.', 409);
      }

      const authorRole = staff ? 'Admin' : 'Customer';
      const { error: replyError } = await admin.from('ticket_replies').insert({
        ticket_id: ticketId,
        author_id: context.user.id,
        author_role: authorRole,
        message: replyMessage,
      });

      if (replyError) return fail(replyError.message, 500);

      const nextStatus = authorRole === 'Admin' ? 'Replied' : 'Open';
      const { data: updatedTicket, error: updateError } = await admin
        .from('support_tickets')
        .update({ status: nextStatus })
        .eq('id', ticketId)
        .select('*')
        .single();

      if (updateError) return fail(updateError.message, 500);

      await admin.from('audit_logs').insert({
        actor_id: context.user.id,
        action: 'support.reply',
        entity_type: 'support_ticket',
        entity_id: ticketId,
        metadata: { author_role: authorRole, status: nextStatus },
      });

      const notificationSettings = await getNotificationSettings(admin);
      if (authorRole === 'Admin' && notificationSettings.orderEmail) {
        await queueNotification(admin, {
          userId: ticket.user_id,
          channel: 'email',
          recipient: ticket.user_email,
          subject: `Support reply: ${ticket.subject}`,
          message: `Your support ticket ${ticketId} has a new reply.`,
          metadata: { ticket_id: ticketId, notification_type: 'support_reply' },
        });
      }

      if (authorRole === 'Customer' && notificationSettings.adminEmail) {
        await queueNotification(admin, {
          channel: 'email',
          recipient: notificationSettings.adminEmail,
          subject: `Customer replied: ${ticket.subject}`,
          message: `Ticket ${ticketId} has a new customer reply.`,
          metadata: { ticket_id: ticketId, notification_type: 'support_customer_reply' },
        });
      }

      const [repliesByTicket, notesByTicket] = await Promise.all([
        loadRows('ticket_replies', [ticketId]),
        staff ? loadRows('support_ticket_notes', [ticketId]) : Promise.resolve(new Map()),
      ]);
      return ok({
        ticket: ticketToClient(
          updatedTicket,
          repliesByTicket.get(ticketId) || [],
          notesByTicket.get(ticketId) || [],
          staff
        ),
      });
    }

    if (action === 'updateStatus' || action === 'updateTicket') {
      const context = await requireRole(request, ADMIN_ROLES);
      if (context.error) return fail(context.error, context.status);

      const ticketId = String(body.ticketId || '').trim();
      const status = body.status ? String(body.status).trim() : null;
      const priority = body.priority ? String(body.priority).trim() : null;
      const assignedTo = body.assignedTo === '' ? null : body.assignedTo;
      const updates = {};

      if (!ticketId) return fail('Ticket ID is required.', 422);
      if (status) {
        if (!TICKET_STATUSES.includes(status)) return fail('Invalid ticket status.', 422);
        updates.status = status;
      }
      if (priority) {
        if (!TICKET_PRIORITIES.includes(priority)) return fail('Invalid ticket priority.', 422);
        updates.priority = priority;
      }
      if (body.assignedTo !== undefined) updates.assigned_to = assignedTo || null;

      if (Object.keys(updates).length === 0) {
        return fail('No valid ticket update supplied.', 422);
      }

      const { data: ticket, error } = await admin
        .from('support_tickets')
        .update(updates)
        .eq('id', ticketId)
        .select('*')
        .single();

      if (error) return fail(error.message, 500);

      await admin.from('audit_logs').insert({
        actor_id: context.user.id,
        action: 'support.ticket_update',
        entity_type: 'support_ticket',
        entity_id: ticketId,
        metadata: updates,
      });

      const [repliesByTicket, notesByTicket] = await Promise.all([
        loadRows('ticket_replies', [ticketId]),
        loadRows('support_ticket_notes', [ticketId]),
      ]);
      return ok({
        ticket: ticketToClient(
          ticket,
          repliesByTicket.get(ticketId) || [],
          notesByTicket.get(ticketId) || [],
          true
        ),
      });
    }

    if (action === 'internalNote') {
      const context = await requireRole(request, ADMIN_ROLES);
      if (context.error) return fail(context.error, context.status);

      const ticketId = String(body.ticketId || '').trim();
      const note = String(body.note || '').trim();
      if (!ticketId || !note) return fail('Ticket ID and note are required.', 422);

      const { data: ticket, error: ticketError } = await admin
        .from('support_tickets')
        .select('*')
        .eq('id', ticketId)
        .single();

      if (ticketError || !ticket) return fail('Ticket not found.', 404);

      const { error } = await admin.from('support_ticket_notes').insert({
        ticket_id: ticketId,
        author_id: context.user.id,
        note,
      });

      if (error) return fail(error.message, 500);

      await admin.from('audit_logs').insert({
        actor_id: context.user.id,
        action: 'support.internal_note',
        entity_type: 'support_ticket',
        entity_id: ticketId,
        metadata: { note_length: note.length },
      });

      const [repliesByTicket, notesByTicket] = await Promise.all([
        loadRows('ticket_replies', [ticketId]),
        loadRows('support_ticket_notes', [ticketId]),
      ]);
      return ok({
        ticket: ticketToClient(
          ticket,
          repliesByTicket.get(ticketId) || [],
          notesByTicket.get(ticketId) || [],
          true
        ),
      });
    }

    const context = await requireUser(request);
    if (context.error) return fail(context.error, context.status);

    const subject = String(body.subject || 'General Inquiry').trim();
    const message = String(body.message || '').trim();
    const priority = TICKET_PRIORITIES.includes(body.priority) ? body.priority : 'normal';
    const orderId = String(body.orderId || '').trim() || null;
    if (!subject || !message) {
      return fail('Subject and message are required.', 422);
    }

    if (orderId) {
      const { data: order } = await admin
        .from('orders')
        .select('id,user_id')
        .eq('id', orderId)
        .eq('user_id', context.user.id)
        .maybeSingle();
      if (!order) return fail('Linked order not found.', 404);
    }

    const profile = context.profile || {};
    const { data: ticket, error } = await admin
      .from('support_tickets')
      .insert({
        user_id: context.user.id,
        order_id: orderId,
        user_name: profile.full_name || context.user.email || 'Customer',
        user_email: profile.email || context.user.email,
        subject,
        message,
        priority,
        status: 'Open',
        metadata: { source: body.source || 'support_widget' },
      })
      .select('*')
      .single();

    if (error) return fail(error.message, 500);

    await admin.from('audit_logs').insert({
      actor_id: context.user.id,
      action: 'support.ticket_create',
      entity_type: 'support_ticket',
      entity_id: ticket.id,
      metadata: { subject, priority, order_id: orderId },
    });

    const notificationSettings = await getNotificationSettings(admin);
    if (notificationSettings.adminEmail) {
      await queueNotification(admin, {
        channel: 'email',
        recipient: notificationSettings.adminEmail,
        subject: `New support ticket: ${subject}`,
        message: `Ticket ${ticket.id} was created by ${ticket.user_name}.`,
        metadata: { ticket_id: ticket.id, notification_type: 'support_new_ticket' },
      });
    }

    return ok({ ticket: ticketToClient(ticket) });
  } catch (error) {
    return fail(error.message || 'Unable to process ticket request.', 500);
  }
}
