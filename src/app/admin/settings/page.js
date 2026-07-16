"use client";
import { useEffect, useState } from 'react';
import { Bell, CreditCard, FileText, Percent, Save, Store } from 'lucide-react';
import styles from './page.module.css';

const defaultSettings = {
  store: {},
  payment: { instructions: {}, stripe: {} },
  tax: {},
  invoice: {},
  notification: {},
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch('/api/admin/settings');
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || 'Unable to load settings.');
        setSettings(data.settings);
      } catch (error) {
        setMessage(error.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, []);

  const updateSection = (section, key, value) => {
    setSettings((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [key]: value,
      },
    }));
  };

  const updateInstruction = (key, value) => {
    setSettings((current) => ({
      ...current,
      payment: {
        ...current.payment,
        instructions: {
          ...(current.payment.instructions || {}),
          [key]: value,
        },
      },
    }));
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to save settings.');
      setSettings(data.settings);
      setMessage('Settings saved successfully.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className={styles.container}>Loading settings...</div>;

  return (
    <form className={styles.container} onSubmit={saveSettings}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Store Settings</h1>
          <p className={styles.subtitle}>Control storefront identity, payment options, invoice, tax, and notifications.</p>
        </div>
        <button className={styles.saveBtn} disabled={isSaving}>
          <Save size={18} />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {message && <p className={styles.message}>{message}</p>}

      <div className={styles.grid}>
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <Store size={20} />
            <h3>Store Identity</h3>
          </div>
          <label>Store Name</label>
          <input value={settings.store.storeName || ''} onChange={(e) => updateSection('store', 'storeName', e.target.value)} />
          <label>Tagline</label>
          <input value={settings.store.tagline || ''} onChange={(e) => updateSection('store', 'tagline', e.target.value)} />
          <label>Support Email</label>
          <input type="email" value={settings.store.supportEmail || ''} onChange={(e) => updateSection('store', 'supportEmail', e.target.value)} />
          <label>Support Phone</label>
          <input value={settings.store.supportPhone || ''} onChange={(e) => updateSection('store', 'supportPhone', e.target.value)} />
          <label>Address</label>
          <textarea rows="3" value={settings.store.address || ''} onChange={(e) => updateSection('store', 'address', e.target.value)} />
          <label>Currency</label>
          <input value={settings.store.currency || 'USD'} onChange={(e) => updateSection('store', 'currency', e.target.value.toUpperCase())} />
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <CreditCard size={20} />
            <h3>Payment Methods</h3>
          </div>
          {['cod', 'bkash', 'nagad', 'card'].map((method) => (
            <div key={method} className={styles.toggleRow}>
              <div>
                <strong>{method.toUpperCase()}</strong>
                <span>{settings.payment.instructions?.[method] || ''}</span>
              </div>
              <input
                type="checkbox"
                checked={Boolean(settings.payment[method])}
                onChange={(e) => updateSection('payment', method, e.target.checked)}
              />
            </div>
          ))}
          {['cod', 'bkash', 'nagad', 'card', 'stripe'].map((method) => (
            <div key={`${method}-instructions`} className={styles.compactField}>
              <label>{method.toUpperCase()} Instruction</label>
              <input
                value={settings.payment.instructions?.[method] || ''}
                onChange={(e) => updateInstruction(method, e.target.value)}
              />
            </div>
          ))}
          <div className={styles.gatewayBox}>
            <div className={styles.toggleRow}>
              <div>
                <strong>STRIPE CHECKOUT</strong>
                <span>Enable hosted Stripe payment from checkout.</span>
              </div>
              <input
                type="checkbox"
                checked={Boolean(settings.payment.stripe?.enabled)}
                onChange={(e) => updateSection('payment', 'stripe', {
                  ...(settings.payment.stripe || {}),
                  enabled: e.target.checked,
                })}
              />
            </div>
            <label>Stripe Mode</label>
            <select
              className={styles.select}
              value={settings.payment.stripe?.mode || 'test'}
              onChange={(e) => updateSection('payment', 'stripe', {
                ...(settings.payment.stripe || {}),
                mode: e.target.value,
              })}
            >
              <option value="test">Test</option>
              <option value="live">Live</option>
            </select>
            <label>Publishable Key</label>
            <input
              value={settings.payment.stripe?.publishableKey || ''}
              onChange={(e) => updateSection('payment', 'stripe', {
                ...(settings.payment.stripe || {}),
                publishableKey: e.target.value,
              })}
              placeholder="pk_test_..."
            />
            <label>Secret Key</label>
            <input
              type="password"
              value={settings.payment.stripe?.secretKey || ''}
              onChange={(e) => updateSection('payment', 'stripe', {
                ...(settings.payment.stripe || {}),
                secretKey: e.target.value,
              })}
              placeholder="sk_test_..."
            />
            <label>Webhook Secret</label>
            <input
              type="password"
              value={settings.payment.stripe?.webhookSecret || ''}
              onChange={(e) => updateSection('payment', 'stripe', {
                ...(settings.payment.stripe || {}),
                webhookSecret: e.target.value,
              })}
              placeholder="whsec_..."
            />
            <div className={styles.inlineFields}>
              <div>
                <label>Stripe Currency</label>
                <input
                  value={settings.payment.stripe?.currency || 'usd'}
                  onChange={(e) => updateSection('payment', 'stripe', {
                    ...(settings.payment.stripe || {}),
                    currency: e.target.value.toLowerCase(),
                  })}
                  placeholder="usd"
                />
              </div>
              <div>
                <label>Stripe Exchange Rate</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={settings.payment.stripe?.exchangeRate || 1}
                  onChange={(e) => updateSection('payment', 'stripe', {
                    ...(settings.payment.stripe || {}),
                    exchangeRate: Number(e.target.value),
                  })}
                />
              </div>
            </div>
            <p className={styles.helpText}>
              Webhook URL: /api/payments/stripe/webhook
            </p>
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <Percent size={20} />
            <h3>Tax / VAT</h3>
          </div>
          <div className={styles.toggleRow}>
            <div>
              <strong>Enable Tax</strong>
              <span>Add tax to checkout totals and invoices.</span>
            </div>
            <input
              type="checkbox"
              checked={Boolean(settings.tax.enabled)}
              onChange={(e) => updateSection('tax', 'enabled', e.target.checked)}
            />
          </div>
          <label>Tax Label</label>
          <input value={settings.tax.label || 'VAT'} onChange={(e) => updateSection('tax', 'label', e.target.value)} />
          <label>Tax Rate (%)</label>
          <input type="number" min="0" max="100" step="0.01" value={settings.tax.rate || 0} onChange={(e) => updateSection('tax', 'rate', Number(e.target.value))} />
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <FileText size={20} />
            <h3>Invoice</h3>
          </div>
          <label>Invoice Prefix</label>
          <input value={settings.invoice.prefix || 'CV'} onChange={(e) => updateSection('invoice', 'prefix', e.target.value.toUpperCase())} />
          <label>Footer Note</label>
          <textarea rows="3" value={settings.invoice.footerNote || ''} onChange={(e) => updateSection('invoice', 'footerNote', e.target.value)} />
          <div className={styles.toggleRow}>
            <div>
              <strong>Show Contact</strong>
              <span>Show support email and phone on invoice.</span>
            </div>
            <input
              type="checkbox"
              checked={Boolean(settings.invoice.showSupportContact)}
              onChange={(e) => updateSection('invoice', 'showSupportContact', e.target.checked)}
            />
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <Bell size={20} />
            <h3>Notifications</h3>
          </div>
          <div className={styles.toggleRow}>
            <div>
              <strong>Order Email</strong>
              <span>Queue email notification logs after checkout.</span>
            </div>
            <input
              type="checkbox"
              checked={Boolean(settings.notification.orderEmail)}
              onChange={(e) => updateSection('notification', 'orderEmail', e.target.checked)}
            />
          </div>
          <div className={styles.toggleRow}>
            <div>
              <strong>Order SMS</strong>
              <span>Queue SMS notification logs after checkout.</span>
            </div>
            <input
              type="checkbox"
              checked={Boolean(settings.notification.orderSms)}
              onChange={(e) => updateSection('notification', 'orderSms', e.target.checked)}
            />
          </div>
          <label>Admin Notification Email</label>
          <input type="email" value={settings.notification.adminEmail || ''} onChange={(e) => updateSection('notification', 'adminEmail', e.target.value)} />
          <div className={styles.gatewayBox}>
            <label>Email Provider</label>
            <select
              className={styles.select}
              value={settings.notification.emailProvider || 'resend'}
              onChange={(e) => updateSection('notification', 'emailProvider', e.target.value)}
            >
              <option value="resend">Resend</option>
            </select>
            <label>Resend API Key</label>
            <input
              type="password"
              value={settings.notification.resendApiKey || ''}
              onChange={(e) => updateSection('notification', 'resendApiKey', e.target.value)}
              placeholder="re_..."
            />
            <label>Email From</label>
            <input
              value={settings.notification.emailFrom || ''}
              onChange={(e) => updateSection('notification', 'emailFrom', e.target.value)}
              placeholder="CartsVista <orders@yourdomain.com>"
            />
            <p className={styles.helpText}>
              Use a verified Resend sender/domain for live email delivery.
            </p>
          </div>
          <div className={styles.gatewayBox}>
            <label>SMS Provider</label>
            <select
              className={styles.select}
              value={settings.notification.smsProvider || 'twilio'}
              onChange={(e) => updateSection('notification', 'smsProvider', e.target.value)}
            >
              <option value="twilio">Twilio</option>
            </select>
            <label>Twilio Account SID</label>
            <input
              value={settings.notification.twilioAccountSid || ''}
              onChange={(e) => updateSection('notification', 'twilioAccountSid', e.target.value)}
              placeholder="AC..."
            />
            <label>Twilio Auth Token</label>
            <input
              type="password"
              value={settings.notification.twilioAuthToken || ''}
              onChange={(e) => updateSection('notification', 'twilioAuthToken', e.target.value)}
            />
            <label>Twilio From Number</label>
            <input
              value={settings.notification.twilioFromNumber || ''}
              onChange={(e) => updateSection('notification', 'twilioFromNumber', e.target.value)}
              placeholder="+15551234567"
            />
            <p className={styles.helpText}>
              Use an active Twilio sender number for customer SMS delivery.
            </p>
          </div>
        </section>
      </div>
    </form>
  );
}
