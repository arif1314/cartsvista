"use client";
import { useEffect, useMemo, useState } from 'react';
import { Bell, RefreshCw, RotateCcw, Send } from 'lucide-react';
import styles from './page.module.css';

function statusClass(status) {
  if (status === 'sent') return styles.statusSent;
  if (status === 'failed') return styles.statusFailed;
  return styles.statusQueued;
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');

  const stats = useMemo(() => notifications.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {}), [notifications]);

  async function loadNotifications() {
    setIsLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/notifications');
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to load notifications.');
      setNotifications(data.notifications || []);
      setSettings(data.settings || {});
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function processQueue(action = 'processQueue', id = null) {
    setIsProcessing(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, id }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to process notifications.');
      setMessage(`Processed ${data.processed}. Sent ${data.sent}, failed ${data.failed}.`);
      await loadNotifications();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsProcessing(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Notifications</h1>
          <p className={styles.subtitle}>Send queued order and support email/SMS messages from one admin queue.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.linkBtn} type="button" onClick={loadNotifications} disabled={isLoading || isProcessing}>
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
          <button className={styles.linkBtn} type="button" onClick={() => processQueue('retryFailed')} disabled={isProcessing}>
            <RotateCcw size={16} />
            <span>Retry Failed</span>
          </button>
          <button className={styles.linkBtn} type="button" onClick={() => processQueue()} disabled={isProcessing}>
            <Send size={16} />
            <span>{isProcessing ? 'Sending...' : 'Process Queue'}</span>
          </button>
        </div>
      </div>

      {message && <p className={styles.notice}>{message}</p>}

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <Bell size={20} />
          <span>Queued</span>
          <strong>{stats.queued || 0}</strong>
        </div>
        <div className={styles.summaryCard}>
          <Send size={20} />
          <span>Sent</span>
          <strong>{stats.sent || 0}</strong>
        </div>
        <div className={styles.summaryCard}>
          <RotateCcw size={20} />
          <span>Failed</span>
          <strong>{stats.failed || 0}</strong>
        </div>
      </div>

      <section className={styles.card}>
        <div className={styles.toolbar}>
          <div>
            <p className={styles.fw500}>Provider Status</p>
            <p className={styles.textMuted}>
              Email: {settings.emailProvider || 'resend'} {settings.hasResendApiKey ? 'configured' : 'needs API key'} from {settings.emailFrom || 'default sender'}.
              {' '}SMS: {settings.smsProvider || 'twilio'} {settings.hasTwilioCredentials ? 'configured' : 'needs credentials'}.
            </p>
          </div>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Channel</th>
                <th>Recipient</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((notification) => (
                <tr key={notification.id}>
                  <td className={styles.fw500}>{notification.channel.toUpperCase()}</td>
                  <td>{notification.recipient}</td>
                  <td>
                    <span className={styles.fw500}>{notification.subject || 'SMS message'}</span>
                    {notification.metadata?.error && (
                      <p className={styles.textMuted}>{notification.metadata.error}</p>
                    )}
                  </td>
                  <td>
                    <span className={`${styles.statusSelect} ${statusClass(notification.status)}`}>
                      {notification.status}
                    </span>
                  </td>
                  <td>{new Date(notification.createdAt).toLocaleString()}</td>
                  <td>
                    <button
                      className={styles.actionBtn}
                      type="button"
                      title="Send this notification"
                      onClick={() => processQueue('sendOne', notification.id)}
                      disabled={isProcessing}
                    >
                      <Send size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && notifications.length === 0 && (
                <tr>
                  <td colSpan="6">No notifications have been queued yet.</td>
                </tr>
              )}
              {isLoading && (
                <tr>
                  <td colSpan="6">Loading notifications...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
