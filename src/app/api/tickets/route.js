import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const TICKETS_FILE = path.join(process.cwd(), 'tickets.json');

function readTickets() {
  if (!fs.existsSync(TICKETS_FILE)) {
    return [];
  }
  try {
    const data = fs.readFileSync(TICKETS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    console.error("Error reading tickets file:", e);
    return [];
  }
}

function writeTickets(tickets) {
  try {
    fs.writeFileSync(TICKETS_FILE, JSON.stringify(tickets, null, 2), 'utf8');
  } catch (e) {
    console.error("Error writing tickets file:", e);
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const tickets = readTickets();

  if (userId) {
    // Return tickets only for this user
    return NextResponse.json(tickets.filter(t => t.userId === userId));
  }
  return NextResponse.json(tickets);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const tickets = readTickets();
    const { action, ticketId, replyMessage, author } = body;

    if (action === 'reply' && ticketId) {
      // Add a message/reply to a ticket conversation
      const ticketIndex = tickets.findIndex(t => t.id === ticketId);
      if (ticketIndex > -1) {
        const ticket = tickets[ticketIndex];
        const reply = {
          id: 'RPL-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
          author: author || 'Admin',
          message: replyMessage,
          createdAt: new Date().toISOString()
        };
        ticket.replies = ticket.replies || [];
        ticket.replies.push(reply);
        
        // Update status based on sender
        ticket.status = author === 'Admin' ? 'Replied' : 'Open';
        
        tickets[ticketIndex] = ticket;
        writeTickets(tickets);
        return NextResponse.json({ success: true, ticket });
      }
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    } else if (action === 'updateStatus' && ticketId) {
      // Update the status (e.g. Closed) of a ticket
      const ticketIndex = tickets.findIndex(t => t.id === ticketId);
      if (ticketIndex > -1) {
        tickets[ticketIndex].status = body.status;
        writeTickets(tickets);
        return NextResponse.json({ success: true, ticket: tickets[ticketIndex] });
      }
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    } else {
      // Create new support ticket
      const newTicket = {
        id: 'TCK-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
        userId: body.userId || 'customer_shahria',
        userName: body.userName || 'Shahria Arif',
        userEmail: body.userEmail || 'shahria.arif@example.com',
        subject: body.subject || 'General Inquiry',
        message: body.message || '',
        status: 'Open',
        createdAt: new Date().toISOString(),
        replies: []
      };
      tickets.push(newTicket);
      writeTickets(tickets);
      return NextResponse.json({ success: true, ticket: newTicket });
    }
  } catch (e) {
    console.error("Error processing ticket request:", e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
