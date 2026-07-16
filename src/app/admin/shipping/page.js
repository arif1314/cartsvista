"use client";
import { useEffect, useState } from 'react';
import styles from '../coupons/page.module.css';

export default function ShippingPage() {
  const [settings, setSettings] = useState({
    defaultShippingAmount: 10,
    freeShippingThreshold: 100,
    insideDhakaAmount: 5,
    outsideDhakaAmount: 10,
  });
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch('/api/admin/settings/shipping');
        const data = await response.json();
        if (response.ok && data.success) setSettings(data.settings);
      } catch (error) {
        setMessage(error.message);
      }
    }

    loadSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/settings/shipping', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to save settings.');
      setSettings(data.settings);
      setMessage('Shipping settings saved.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const updateNumber = (key, value) => {
    setSettings({ ...settings, [key]: Number(value) });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Shipping Settings</h1>
        <p className={styles.subtitle}>Control shipping charges and free-shipping rules from admin.</p>
      </div>

      {message && <p>{message}</p>}

      <form className={styles.card} onSubmit={handleSubmit}>
        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label>Default Shipping Amount</label>
            <input type="number" value={settings.defaultShippingAmount} onChange={(e) => updateNumber('defaultShippingAmount', e.target.value)} />
          </div>
          <div className={styles.formGroup}>
            <label>Free Shipping Threshold</label>
            <input type="number" value={settings.freeShippingThreshold} onChange={(e) => updateNumber('freeShippingThreshold', e.target.value)} />
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label>Inside Dhaka Amount</label>
            <input type="number" value={settings.insideDhakaAmount} onChange={(e) => updateNumber('insideDhakaAmount', e.target.value)} />
          </div>
          <div className={styles.formGroup}>
            <label>Outside Dhaka Amount</label>
            <input type="number" value={settings.outsideDhakaAmount} onChange={(e) => updateNumber('outsideDhakaAmount', e.target.value)} />
          </div>
        </div>
        <button className={styles.button} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Shipping Settings'}</button>
      </form>
    </div>
  );
}
