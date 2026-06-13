"use client";
import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Calendar, ChevronRight, Send, Clock, User, Mail, ShieldAlert, CheckCircle, RefreshCw } from 'lucide-react';
import styles from './page.module.css';

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const chatEndRef = useRef(null);

  const fetchTickets = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const response = await fetch('/api/tickets');
      const data = await response.json();
      // Sort newest first
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setTickets(data);
      
      // Update currently active/selected ticket details if open
      if (selectedTicket) {
        const updated = data.find(t => t.id === selectedTicket.id);
        if (updated) setSelectedTicket(updated);
      }
    } catch (e) {
      console.error("Error fetching admin support tickets:", e);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Scroll to bottom of chat when a ticket is opened or message added
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedTicket]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;
    
    setIsSending(true);
    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reply',
          ticketId: selectedTicket.id,
          replyMessage: replyText,
          author: 'Admin'
        }),
      });
      const data = await response.json();
      if (data.success) {
        setReplyText('');
        // Refresh ticket list
        await fetchTickets(false);
      } else {
        alert("Failed to send reply. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to send reply due to a connection issue.");
    } finally {
      setIsSending(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedTicket) return;
    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateStatus',
          ticketId: selectedTicket.id,
          status: newStatus
        }),
      });
      const data = await response.json();
      if (data.success) {
        // Refresh ticket list
        await fetchTickets(false);
      } else {
        alert("Failed to update status. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update status due to a connection issue.");
    }
  };

  const filteredTickets = tickets.filter(t => {
    if (filterStatus === 'All') return true;
    return t.status === filterStatus;
  });

  const getStatusClass = (status) => {
    switch (status) {
      case 'Open': return styles.statusOpen;
      case 'Replied': return styles.statusReplied;
      case 'Closed': return styles.statusClosed;
      default: return '';
    }
  };

  const formatDate = (dateString) => {
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
      {/* Filters & Actions Header */}
      <div className={styles.filterBar}>
        <div className={styles.statusTabs}>
          {['All', 'Open', 'Replied', 'Closed'].map(status => (
            <button 
              key={status}
              className={`${styles.tabBtn} ${filterStatus === status ? styles.activeTab : ''}`}
              onClick={() => setFilterStatus(status)}
            >
              {status}
              <span className={styles.tabCount}>
                {status === 'All' 
                  ? tickets.length 
                  : tickets.filter(t => t.status === status).length}
              </span>
            </button>
          ))}
        </div>
        
        <button className={styles.refreshBtn} onClick={() => fetchTickets(true)} title="Refresh Tickets List">
          <RefreshCw size={15} />
          Sync Inbox
        </button>
      </div>

      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.loader}></div>
          <p>Syncing support desk inbox...</p>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className={styles.emptyState}>
          <MessageSquare size={36} className={styles.emptyIcon} />
          <h3>No Tickets Found</h3>
          <p>There are no support tickets matching status "{filterStatus}".</p>
        </div>
      ) : (
        <div className={styles.contentGrid}>
          {/* Left Column: Tickets List */}
          <div className={styles.ticketsList}>
            {filteredTickets.map(ticket => (
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
                <p className={styles.customerName}>Client: {ticket.userName}</p>
                <div className={styles.ticketCardFooter}>
                  <Calendar size={12} />
                  <span>{formatDate(ticket.createdAt)}</span>
                  <ChevronRight size={16} className={styles.chevron} />
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: Ticket Conversation details */}
          <div className={styles.ticketDetails}>
            {selectedTicket ? (
              <div className={styles.detailsBox}>
                {/* Header Information */}
                <div className={styles.detailsHeader}>
                  <div className={styles.headerInfo}>
                    <h3>{selectedTicket.subject}</h3>
                    <div className={styles.metaRow}>
                      <span>ID: <strong>{selectedTicket.id}</strong></span>
                      <span className={styles.divider}>•</span>
                      <User size={12} />
                      <span>{selectedTicket.userName}</span>
                      <span className={styles.divider}>•</span>
                      <Mail size={12} />
                      <a href={`mailto:${selectedTicket.userEmail}`} className={styles.mailLink}>
                        {selectedTicket.userEmail}
                      </a>
                    </div>
                  </div>

                  {/* Admin State Controls */}
                  <div className={styles.statusControls}>
                    <span className={styles.controlLabel}>Ticket Action:</span>
                    <div className={styles.controlGroup}>
                      {selectedTicket.status !== 'Closed' ? (
                        <button 
                          className={styles.closeActionBtn}
                          onClick={() => handleStatusChange('Closed')}
                          title="Mark Ticket as Resolved"
                        >
                          <CheckCircle size={14} />
                          Resolve
                        </button>
                      ) : (
                        <button 
                          className={styles.reopenActionBtn}
                          onClick={() => handleStatusChange('Open')}
                          title="Reopen Closed Ticket"
                        >
                          <ShieldAlert size={14} />
                          Reopen
                        </button>
                      )}
                      <span className={`${styles.statusBadge} ${getStatusClass(selectedTicket.status)}`}>
                        {selectedTicket.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Conversational Chat Box */}
                <div className={styles.chatThread}>
                  {/* Original Customer Message */}
                  <div className={`${styles.chatMessage} ${styles.customerMsg}`}>
                    <div className={styles.msgHeader}>
                      <span className={styles.senderName}>{selectedTicket.userName}</span>
                      <span className={styles.msgTime}>{formatDate(selectedTicket.createdAt)}</span>
                    </div>
                    <div className={styles.msgBody}>
                      <p>{selectedTicket.message}</p>
                    </div>
                  </div>

                  {/* Replies thread */}
                  {selectedTicket.replies && selectedTicket.replies.map((reply, index) => {
                    const isAdmin = reply.author === 'Admin';
                    return (
                      <div 
                        key={reply.id || index} 
                        className={`${styles.chatMessage} ${isAdmin ? styles.adminMsg : styles.customerMsg}`}
                      >
                        <div className={styles.msgHeader}>
                          <span className={styles.senderName}>
                            {isAdmin ? 'You (Atelier Concierge)' : selectedTicket.userName}
                          </span>
                          <span className={styles.msgTime}>{formatDate(reply.createdAt)}</span>
                        </div>
                        <div className={styles.msgBody}>
                          <p>{reply.message}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>

                {/* Reply Form */}
                {selectedTicket.status !== 'Closed' ? (
                  <form className={styles.replyForm} onSubmit={handleSendReply}>
                    <textarea 
                      placeholder="Write a professional styling advice reply..."
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
                          <Send size={15} />
                          Send Concierge Reply
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <div className={styles.closedBanner}>
                    <CheckCircle size={16} />
                    <span>This ticket has been resolved and closed. Reopen the ticket to send further replies.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.noSelectionBox}>
                <MessageSquare size={48} className={styles.dimIcon} />
                <h3>Select a Support Ticket</h3>
                <p>Click on any client inquiry from the inbox panel on the left to read history and reply.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
