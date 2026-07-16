"use client";
import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, CreditCard, MapPin, Package, User } from 'lucide-react';
import { formatCurrency } from '@/lib/format/currency';
import styles from './page.module.css';

const orderStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'canceled', 'refunded'];
const paymentStatuses = ['unpaid', 'pending', 'paid', 'failed', 'refunded'];

function cap(value = '') {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
}

export default function AdminOrderDetails({ params }) {
  const { id } = use(params);
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState('');

  async function fetchOrderDetails() {
    setIsLoading(true);
    setMessage('');
    try {
      const response = await fetch(`/api/admin/orders/${id}`);
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to load order.');
      setOrder(data.order);
    } catch (error) {
      setMessage(error.message);
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const updateOrder = async (patch) => {
    setIsUpdating(true);
    setMessage('');
    try {
      const response = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to update order.');
      await fetchOrderDetails();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) return <div className={styles.container}>Loading order details...</div>;
  if (!order) return <div className={styles.container}>{message || 'Order not found.'}</div>;

  const address = order.shippingAddress || {};
  const customerName = `${address.firstName || ''} ${address.lastName || ''}`.trim() || order.customerEmail || 'Guest';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/admin/orders" className={styles.backLink}>
          <ChevronLeft size={16} /> Back to Orders
        </Link>
        <div className={styles.titleWrapper}>
          <h1 className={styles.title}>Order #{order.id.slice(0, 8).toUpperCase()}</h1>
          <p className={styles.subtitle}>Placed on {new Date(order.date).toLocaleString()}</p>
        </div>
      </div>

      {message && <p style={{ color: '#9f1d1d', marginBottom: '1rem' }}>{message}</p>}

      <div className={styles.contentGrid}>
        <div className={styles.mainColumn}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Order Items</h2>
              <span className={styles.itemCount}>{order.items?.length || 0} items</span>
            </div>

            <div className={styles.itemsList}>
              {order.items?.map((item) => (
                <div key={item.id} className={styles.itemRow}>
                  <div className={styles.itemImage}>
                    <img src={item.image} alt={item.name} />
                  </div>
                  <div className={styles.itemDetails}>
                    <h3 className={styles.itemName}>{item.name}</h3>
                    <p className={styles.itemMeta}>Size: {item.size || '-'}</p>
                    <p className={styles.itemMeta}>Color: {item.color || '-'}</p>
                  </div>
                  <div className={styles.itemPriceQty}>
                    <p className={styles.itemPrice}>{formatCurrency(item.price)}</p>
                    <p className={styles.itemQty}>Qty: {item.qty}</p>
                  </div>
                  <div className={styles.itemTotal}>
                    {formatCurrency(item.price * item.qty)}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.summarySection}>
              <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Shipping</span>
                <span>{formatCurrency(order.shipping)}</span>
              </div>
              {order.discount > 0 && (
                <div className={styles.summaryRow}>
                  <span>Discount</span>
                  <span className={styles.discount}>- {formatCurrency(order.discount)}</span>
                </div>
              )}
              {order.tax > 0 && (
                <div className={styles.summaryRow}>
                  <span>Tax</span>
                  <span>{formatCurrency(order.tax)}</span>
                </div>
              )}
              <div className={styles.divider}></div>
              <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Payments & Notifications</h2>
            <div className={styles.notesBox}>
              <p>Payments: {order.payments?.length || 0}</p>
              <p>Notifications: {order.notifications?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className={styles.sideColumn}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Order Management</h2>
            <div className={styles.formGroup}>
              <label>Order Status</label>
              <select
                value={order.status}
                onChange={(e) => updateOrder({ status: e.target.value })}
                disabled={isUpdating}
                className={`${styles.statusSelect} ${styles[`status${cap(order.status)}`] || ''}`}
              >
                {orderStatuses.map((status) => (
                  <option key={status} value={status}>{cap(status)}</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Payment Status</label>
              <select
                value={order.paymentStatus}
                onChange={(e) => updateOrder({ paymentStatus: e.target.value })}
                disabled={isUpdating}
                className={styles.statusSelect}
              >
                {paymentStatuses.map((status) => (
                  <option key={status} value={status}>{cap(status)}</option>
                ))}
              </select>
            </div>
            <Link href={`/admin/orders/${order.id}/invoice`} className={styles.btnSecondary}>
              View Invoice
            </Link>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Customer Details</h2>
            <div className={styles.customerBox}>
              <div className={styles.customerHeader}>
                <div className={styles.avatar}>
                  {customerName.charAt(0) || <User size={16} />}
                </div>
                <div>
                  <p className={styles.customerName}>{customerName}</p>
                  <p className={styles.customerEmail}>{order.customerEmail || address.email || '-'}</p>
                </div>
              </div>
              <div className={styles.contactDetails}>
                <p><strong>Phone:</strong> {address.phone || '-'}</p>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Shipping Address</h2>
            <div className={styles.addressInfo}>
              <p>{address.address || '-'}</p>
              {address.apartment && <p>{address.apartment}</p>}
              <p>{address.city || '-'}, {address.postalCode || ''}</p>
            </div>
            {address.address && (
              <div className={styles.mapLink}>
                <MapPin size={14} />
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address.address}, ${address.city || ''}`)}`} target="_blank" rel="noopener noreferrer">
                  View on Map
                </a>
              </div>
            )}
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Payment Information</h2>
            <div className={styles.paymentInfo}>
              <p className={styles.paymentMethod}>
                {order.paymentMethod === 'stripe' ? (
                  <><CreditCard size={16} /> Stripe Card</>
                ) : (
                  <><Package size={16} /> {order.paymentMethod?.toUpperCase() || 'COD'}</>
                )}
              </p>
              <div className={styles.paymentStatus}>
                <span className={styles.statusPaid}>{cap(order.paymentStatus)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
