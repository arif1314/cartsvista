"use client";
import { useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import styles from './page.module.css';

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    setIsSubmitting(true);
    setNotice('');

    const formData = new FormData(form);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          email: formData.get('email'),
          subject: formData.get('subject'),
          message: formData.get('message'),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Unable to submit your message.');
      }
      form.reset();
      setNotice('Thank you for reaching out. Your message has been received and our support team will respond within 24 hours.');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link> <span className={styles.separator}>/</span> 
          <span className={styles.current}>Contact Us</span>
        </div>
        <h1 className={styles.pageTitle}>Get in Touch</h1>
        <p className={styles.subtitle}>Our styling and support team is at your disposal.</p>
      </div>

      <div className={styles.contactLayout}>
        {/* Contact Info */}
        <div className={styles.infoSection}>
          <div className={styles.infoBlock}>
            <Phone className={styles.icon} size={24} />
            <h3>Call Us</h3>
            <p>09666 774 677</p>
            <p className={styles.subtext}>Available Saturday to Thursday<br/>10:00 AM - 8:00 PM (BST)</p>
          </div>

          <div className={styles.infoBlock}>
            <Mail className={styles.icon} size={24} />
            <h3>Email Us</h3>
            <p>support@cartsvista.com</p>
            <p className={styles.subtext}>We aim to respond within 24 hours.</p>
          </div>

          <div className={styles.infoBlock}>
            <MapPin className={styles.icon} size={24} />
            <h3>Corporate Office</h3>
            <p>CartsVista Tower, Gulshan Avenue<br/>Dhaka 1212, Bangladesh</p>
          </div>
        </div>

        {/* Contact Form */}
        <div className={styles.formSection}>
          <h2>Send us a message</h2>
          {notice && <p className={styles.notice}>{notice}</p>}
          <form className={styles.contactForm} onSubmit={handleSubmit}>
            <div className={styles.formRow}>
              <div className={styles.inputGroup}>
                <label htmlFor="name">Name *</label>
                <input type="text" id="name" name="name" required placeholder="Enter your full name" />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="email">Email *</label>
                <input type="email" id="email" name="email" required placeholder="Enter your email address" />
              </div>
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="subject">Subject *</label>
              <input type="text" id="subject" name="subject" required placeholder="How can we help you?" />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="message">Message *</label>
              <textarea id="message" name="message" rows="6" required placeholder="Write your message here..."></textarea>
            </div>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
