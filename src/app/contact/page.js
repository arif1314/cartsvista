"use client";
import Link from 'next/link';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import styles from './page.module.css';

export default function ContactPage() {
  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Thank you for reaching out to CartsVista. Our elite support team will respond within 24 hours.");
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
          <form className={styles.contactForm} onSubmit={handleSubmit}>
            <div className={styles.formRow}>
              <div className={styles.inputGroup}>
                <label htmlFor="name">Name *</label>
                <input type="text" id="name" required placeholder="Enter your full name" />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="email">Email *</label>
                <input type="email" id="email" required placeholder="Enter your email address" />
              </div>
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="subject">Subject *</label>
              <input type="text" id="subject" required placeholder="How can we help you?" />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="message">Message *</label>
              <textarea id="message" rows="6" required placeholder="Write your message here..."></textarea>
            </div>
            <button type="submit" className={styles.submitBtn}>Send Message</button>
          </form>
        </div>
      </div>
    </div>
  );
}
