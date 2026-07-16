"use client";
import { useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/format/currency';
import styles from './page.module.css';

const emptyForm = {
  code: '',
  description: '',
  discountType: 'fixed',
  discountValue: '',
  minOrderAmount: '0',
  maxDiscountAmount: '',
  usageLimit: '',
  startsAt: '',
  endsAt: '',
  isActive: true,
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function loadCoupons() {
    const response = await fetch('/api/admin/coupons');
    const data = await response.json();
    if (response.ok && data.success) {
      setCoupons(data.coupons || []);
    } else {
      setMessage(data.error || 'Unable to load coupons.');
    }
  }

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to save coupon.');
      setForm(emptyForm);
      setMessage('Coupon created successfully.');
      await loadCoupons();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const deactivateCoupon = async (id) => {
    if (!confirm('Deactivate this coupon?')) return;
    const response = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
    const data = await response.json();
    if (!response.ok || !data.success) {
      setMessage(data.error || 'Unable to deactivate coupon.');
      return;
    }
    await loadCoupons();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Coupons</h1>
        <p className={styles.subtitle}>Create and manage promotional discount codes.</p>
      </div>

      {message && <p>{message}</p>}

      <div className={styles.layout}>
        <form className={styles.card} onSubmit={handleSubmit}>
          <h3>Create Coupon</h3>
          <div className={styles.formGroup}>
            <label>Code</label>
            <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required />
          </div>
          <div className={styles.formGroup}>
            <label>Description</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label>Type</label>
              <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}>
                <option value="fixed">Fixed Amount</option>
                <option value="percentage">Percentage</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Discount Value</label>
              <input type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} required />
            </div>
          </div>
          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label>Minimum Order</label>
              <input type="number" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} />
            </div>
            <div className={styles.formGroup}>
              <label>Max Discount</label>
              <input type="number" value={form.maxDiscountAmount} onChange={(e) => setForm({ ...form, maxDiscountAmount: e.target.value })} />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Usage Limit</label>
            <input type="number" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} />
          </div>
          <button className={styles.button} disabled={isSaving}>{isSaving ? 'Saving...' : 'Create Coupon'}</button>
        </form>

        <div className={styles.card}>
          <h3>Existing Coupons</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Used</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 ? (
                <tr><td colSpan="5">No coupons yet.</td></tr>
              ) : coupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td>{coupon.code}</td>
                  <td>{coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : formatCurrency(coupon.discount_value)}</td>
                  <td>{coupon.used_count}{coupon.usage_limit ? ` / ${coupon.usage_limit}` : ''}</td>
                  <td><span className={`${styles.badge} ${coupon.is_active ? styles.active : styles.inactive}`}>{coupon.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td>{coupon.is_active && <button className={styles.dangerBtn} onClick={() => deactivateCoupon(coupon.id)}>Deactivate</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
