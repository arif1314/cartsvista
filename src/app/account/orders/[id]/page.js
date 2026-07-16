"use client";
import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Package, MapPin, CreditCard, Clock, Smartphone } from 'lucide-react';
import { formatCurrency } from '@/lib/format/currency';
import styles from './page.module.css';

function statusClass(styles, status = '') {
  switch (status.toLowerCase()) {
    case 'processing': return styles.statusProcessing;
    case 'shipped': return styles.statusShipped;
    case 'delivered': return styles.statusDelivered;
    case 'canceled':
    case 'cancelled': return styles.statusCancelled;
    default: return styles.statusPending;
  }
}

export default function OrderDetailsPage({ params }) {
  const { id } = use(params);
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function fetchOrderDetails() {
      setMessage('');
      try {
        const response = await fetch(`/api/account/orders/${id}`);
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

    fetchOrderDetails();
  }, [id]);

  if (isLoading) return <div className={styles.container}>Loading order details...</div>;
  if (!order) return <div className={styles.container}>{message || 'Order not found.'}</div>;

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const address = order.shippingAddress || {};

  return (
    <div className={styles.container}>
      <Link href="/account/orders" className={styles.backLink}>
        <ChevronLeft size={16} /> Back to Orders
      </Link>

      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Order #{order.id.slice(0, 8)}</h1>
          <p className={styles.orderDate}>Placed on {formatDate(order.date)}</p>
        </div>
        <div className={`${styles.statusBadge} ${statusClass(styles, order.status)}`}>
          {order.status.toUpperCase()}
        </div>
      </div>

      <div className={styles.contentGrid}>
        <div className={styles.mainColumn}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Order Items</h2>
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
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Order Timeline</h2>
            <div className={styles.timeline}>
              <div className={`${styles.timelineEvent} ${styles.completed}`}>
                <div className={styles.timelineIcon}><Clock size={16} /></div>
                <div className={styles.timelineContent}>
                  <h4>Order Placed</h4>
                  <p>{formatDate(order.date)}</p>
                </div>
              </div>

              <div className={`${styles.timelineEvent} ${['processing', 'shipped', 'delivered'].includes(order.status) ? styles.completed : ''}`}>
                <div className={styles.timelineIcon}><Package size={16} /></div>
                <div className={styles.timelineContent}>
                  <h4>Processing</h4>
                  <p>We are preparing your order</p>
                </div>
              </div>

              <div className={`${styles.timelineEvent} ${['shipped', 'delivered'].includes(order.status) ? styles.completed : ''}`}>
                <div className={styles.timelineIcon}><Package size={16} /></div>
                <div className={styles.timelineContent}>
                  <h4>Shipped</h4>
                  <p>Awaiting shipment</p>
                </div>
              </div>

              <div className={`${styles.timelineEvent} ${order.status === 'delivered' ? styles.completed : ''}`}>
                <div className={styles.timelineIcon}><MapPin size={16} /></div>
                <div className={styles.timelineContent}>
                  <h4>Delivered</h4>
                  <p>Order delivered to shipping address</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.sideColumn}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Order Summary</h2>
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
            <div className={styles.divider}></div>
            <div className={`${styles.summaryRow} ${styles.totalRow}`}>
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Shipping Address</h2>
            <div className={styles.addressInfo}>
              <p><strong>{address.firstName} {address.lastName}</strong></p>
              <p>{address.address}</p>
              {address.apartment && <p>{address.apartment}</p>}
              <p>{address.city}, {address.postalCode}</p>
              <p>Phone: {address.phone}</p>
              <p>Email: {address.email || order.customerEmail}</p>
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Payment Method</h2>
            <div className={styles.paymentInfo}>
              {order.paymentMethod === 'stripe' ? (
                <><CreditCard size={18} /> Credit/Debit Card</>
              ) : order.paymentMethod === 'bkash' ? (
                <><Smartphone size={18} /> bKash</>
              ) : order.paymentMethod === 'nagad' ? (
                <><Smartphone size={18} /> Nagad</>
              ) : (
                <><MapPin size={18} /> Cash on Delivery (COD)</>
              )}
            </div>
          </div>

          <Link href={`/account/orders/${order.id}/invoice`} className={styles.backLink}>
            View Invoice
          </Link>
        </div>
      </div>
    </div>
  );
}
