"use client";
import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Calendar, ChevronRight, Send, Clock, User, AlertCircle, RefreshCw } from 'lucide-react';
import styles from './page.module.css';

function ticketFromApi(ticket) {
  return {
    id: ticket.id,
    subject: ticket.subject,
    message: ticket.message,
    status: ticket.status,
    created_at: ticket.createdAt,
    updated_at: ticket.updatedAt,
    ticket_replies: (ticket.replies || []).map((reply) => ({
      id: reply.id,
      author: reply.author,
      message: reply.message,
      created_at: reply.createdAt,
    })),
  };
}

export default function CustomerSupportPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [user, setUser] = useState(null);
  const chatEndRef = useRef(null);

  const fetchTickets = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const response = await fetch('/api/tickets');
      const data = await response.json();

      if (response.ok && data.success) {
        setUser({ authenticated: true });
        const processedTickets = (data.tickets || []).map(ticketFromApi);
        setTickets(processedTickets);

        if (selectedTicket) {
          const updated = processedTickets.find(t => t.id === selectedTicket.id);
          if (updated) setSelectedTicket(updated);
        }
      }
    } catch (e) {
      console.error("Error fetching support tickets:", e);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedTicket]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket || !user) return;
    
    setIsSending(true);
    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reply',
          ticketId: selectedTicket.id,
          replyMessage: replyText,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send reply.');
      }

      setReplyText('');
      await fetchTickets(false);
    } catch (err) {
      console.error(err);
      alert("Failed to send reply due to a connection issue.");
    } finally {
      setIsSending(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'open': return styles.statusOpen;
      case 'replied': return styles.statusReplied;
      case 'closed': return styles.statusClosed;
      default: return '';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={styles.supportContainer}>
      <div className={styles.pageHeader}>
        <div>
          <h2>Support Tickets</h2>
          <p>View, track, and reply to your concierge styling inquiries.</p>
        </div>
        <button className={styles.refreshBtn} onClick={() => fetchTickets(true)} title="Refresh Tickets">
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.loader}></div>
          <p>Loading your tickets...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}><MessageSquare size={36} /></div>
          <h3>No Support Tickets Found</h3>
          <p>You have not submitted any concierge support requests yet.</p>
          <p className={styles.emptyNote}>
            To ask a question about product fits, customized sherwanis, boutique appointments, or orders, click the **Styling Support FAB (Message bubble)** in the bottom right corner of the website.
          </p>
        </div>
      ) : (
        <div className={styles.contentGrid}>
          {/* Left Column: Tickets List */}
          <div className={styles.ticketsList}>
            {tickets.map(ticket => (
              <div 
                key={ticket.id} 
                className={`${styles.ticketCard} ${selectedTicket?.id === ticket.id ? styles.activeCard : ''}`}
                onClick={() => setSelectedTicket(ticket)}
              >
                <div className={styles.ticketCardHeader}>
                  <span className={styles.ticketId}>{ticket.id}</span>
                  <span className={`${styles.statusBadge} ${getStatusClass(ticket.status)}`}>
                    {ticket.status}
                  </span>
                </div>
                <h4 className={styles.ticketSubject}>{ticket.subject}</h4>
                <div className={styles.ticketCardFooter}>
                  <Calendar size={12} />
                  <span>{formatDate(ticket.created_at)}</span>
                  <ChevronRight size={16} className={styles.chevron} />
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: Ticket Conversation Details */}
          <div className={styles.ticketDetails}>
            {selectedTicket ? (
              <div className={styles.detailsBox}>
                <div className={styles.detailsHeader}>
                  <div>
                    <h3>{selectedTicket.subject}</h3>
                    <p className={styles.ticketMeta}>Ticket ID: {selectedTicket.id} | Created: {formatDate(selectedTicket.created_at)}</p>
                  </div>
                  <span className={`${styles.statusBadge} ${getStatusClass(selectedTicket.status)}`}>
                    {selectedTicket.status}
                  </span>
                </div>

                {/* Conversation Thread */}
                <div className={styles.chatThread}>
                  {/* Original Customer Message */}
                  <div className={`${styles.chatMessage} ${styles.customerMsg}`}>
                    <div className={styles.msgHeader}>
                      <span className={styles.senderName}>You</span>
                      <span className={styles.msgTime}>{formatDate(selectedTicket.created_at)}</span>
                    </div>
                    <div className={styles.msgBody}>
                      <p>{selectedTicket.message}</p>
                    </div>
                  </div>

                  {/* Replies */}
                  {selectedTicket.ticket_replies?.map((reply, index) => {
                    const isAdmin = reply.author === 'Admin';
                    return (
                      <div 
                        key={reply.id || index} 
                        className={`${styles.chatMessage} ${isAdmin ? styles.adminMsg : styles.customerMsg}`}
                      >
                        <div className={styles.msgHeader}>
                          <span className={styles.senderName}>
                            {isAdmin ? 'Styling Concierge (Admin)' : 'You'}
                          </span>
                          <span className={styles.msgTime}>{formatDate(reply.created_at)}</span>
                        </div>
                        <div className={styles.msgBody}>
                          <p>{reply.message}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>

                {/* Send Reply Input */}
                {selectedTicket.status?.toLowerCase() !== 'closed' ? (
                  <form className={styles.replyForm} onSubmit={handleSendReply}>
                    <textarea 
                      placeholder="Write a message back to our styling concierge..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={3}
                      required
                    />
                    <button type="submit" className={styles.sendBtn} disabled={isSending || !replyText.trim()}>
                      {isSending ? (
                        <div className={styles.miniLoader} />
                      ) : (
                        <>
                          <Send size={16} />
                          Send Reply
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <div className={styles.closedBanner}>
                    <AlertCircle size={16} />
                    <span>This ticket has been marked as **Closed** by the atelier team. You cannot send replies.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.noSelectionBox}>
                <MessageSquare size={48} className={styles.dimIcon} />
                <h3>No Ticket Selected</h3>
                <p>Select a ticket from the left column to view its full conversation and details.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
