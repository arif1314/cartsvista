"use client";
import { useState, useEffect } from 'react';
import { MessageSquare, Phone, MessageCircle, AlertCircle, ChevronUp, X, MessageSquareQuote, Send, Loader2 } from 'lucide-react';
import styles from './SupportWidget.module.css';

export default function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Support Form Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [ticketId, setTicketId] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePhoneClick = () => {
    window.location.href = 'tel:+15058843682';
  };

  const handleWhatsAppClick = () => {
    window.open('https://wa.me/15058843682', '_blank');
  };

  const handleOpenForm = () => {
    setIsFormOpen(true);
    setIsOpen(false); // Close radial menu
    setSubmitSuccess(false);
    setSubject('');
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'customer_shahria', // Default logged-in user
          userName: 'Shahria Arif',
          userEmail: 'shahria.arif@example.com',
          subject: subject,
          message: message,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setTicketId(data.ticket.id);
        setSubmitSuccess(true);
        setSubject('');
        setMessage('');
      } else {
        alert("Failed to submit support ticket. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to submit support ticket due to a connection issue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className={styles.widgetContainer}>
        <div className={`${styles.menu} ${isOpen ? styles.open : ''}`}>
          {/* Feedback Ticket Button */}
          <button 
            className={styles.menuItem} 
            style={{ '--i': 1 }} 
            onClick={handleOpenForm}
            title="Submit Feedback/Ticket"
          >
            <AlertCircle size={20} strokeWidth={1.5} />
          </button>
          
          {/* Live Chat Ticket Button */}
          <button 
            className={styles.menuItem} 
            style={{ '--i': 2 }} 
            onClick={handleOpenForm}
            title="Live Chat Support"
          >
            <MessageSquare size={20} strokeWidth={1.5} />
          </button>
          
          {/* WhatsApp Button */}
          <button 
            className={styles.menuItem} 
            style={{ '--i': 3 }} 
            onClick={handleWhatsAppClick}
            title="WhatsApp Chat"
          >
            <MessageCircle size={20} strokeWidth={1.5} />
          </button>
          
          {/* Phone Dial Button */}
          <button 
            className={styles.menuItem} 
            style={{ '--i': 4 }} 
            onClick={handlePhoneClick}
            title="Call Styling Concierge"
          >
            <Phone size={20} strokeWidth={1.5} />
          </button>
          
          {/* Scroll Up Button */}
          <button 
            className={`${styles.menuItem} ${showScrollTop ? styles.showScroll : ''}`} 
            style={{ '--i': 5 }} 
            onClick={scrollToTop} 
            title="Scroll Up"
          >
            <ChevronUp size={20} strokeWidth={1.5} />
          </button>
        </div>

        {/* Main Floating Trigger Button */}
        <button 
          className={`${styles.mainButton} ${isOpen ? styles.isOpen : ''}`} 
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={26} strokeWidth={1.5} /> : <MessageSquareQuote size={28} strokeWidth={1.5} className={styles.flipHorizontal} />}
        </button>
      </div>

      {/* Luxury Form Modal Overlay */}
      {isFormOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsFormOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setIsFormOpen(false)}>
              <X size={20} />
            </button>

            {submitSuccess ? (
              <div className={styles.successState}>
                <div className={styles.successBadge}>✓</div>
                <h3>Concierge Ticket Created</h3>
                <p className={styles.ticketIdText}>Ticket ID: <strong>{ticketId}</strong></p>
                <p className={styles.successDesc}>
                  We have received your support request. Our styling concierge team will review your message shortly.
                </p>
                <p className={styles.successNote}>
                  You can track this ticket, view status updates, and chat directly with our team under the <strong>Support Tickets</strong> section of your Customer Dashboard.
                </p>
                <button className={styles.doneBtn} onClick={() => setIsFormOpen(false)}>
                  Done
                </button>
              </div>
            ) : (
              <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.modalHeader}>
                  <h2>Concierge Styling Support</h2>
                  <p>Send a message to our Albuquerque boutique styling team.</p>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="subject">Subject / Inquiry Type</label>
                  <input 
                    type="text" 
                    id="subject" 
                    placeholder="e.g. Size advice for Royal Sherwani" 
                    value={subject} 
                    onChange={(e) => setSubject(e.target.value)}
                    required 
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="message">Your Message</label>
                  <textarea 
                    id="message" 
                    rows={5}
                    placeholder="Describe how we can assist you with your styling or order..." 
                    value={message} 
                    onChange={(e) => setMessage(e.target.value)}
                    required 
                  />
                </div>

                <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className={`${styles.spinner} ${styles.animateSpinner}`} />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
