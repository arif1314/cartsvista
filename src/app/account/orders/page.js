"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/format/currency';
import styles from './page.module.css';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const response = await fetch('/api/account/orders');
        const data = await response.json();
        if (response.ok && data.success) {
          setOrders(data.orders || []);
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={styles.ordersContainer}>
      <h2 className={styles.title}>Order History</h2>
      <p className={styles.subtitle}>Check the status of recent orders, manage returns, and discover similar products.</p>

      {isLoading ? (
        <p>Loading your orders...</p>
      ) : orders.length === 0 ? (
        <div style={{ padding: '2rem 0', textAlign: 'center' }}>
          <p>You haven't placed any orders yet.</p>
          <Link href="/" style={{ textDecoration: 'underline', color: 'var(--primary)', marginTop: '1rem', display: 'inline-block' }}>
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className={styles.ordersList}>
          {orders.map((order) => (
            <div key={order.id} className={styles.orderCard}>
              <div className={styles.orderHeader}>
                <div className={styles.headerInfo}>
                  <div>
                    <p className={styles.label}>Order Number</p>
                    <p className={styles.value}>#{order.id.slice(0, 8)}</p>
                  </div>
                  <div className={styles.divider}></div>
                  <div>
                    <p className={styles.label}>Date Placed</p>
                    <p className={styles.value}>{formatDate(order.date)}</p>
                  </div>
                  <div className={styles.divider}></div>
                  <div>
                    <p className={styles.label}>Total Amount</p>
                    <p className={styles.value}>{formatCurrency(order.total)}</p>
                  </div>
                </div>
                <div className={styles.headerActions}>
                  <Link href={`/account/orders/${order.id}`} className={styles.invoiceBtn}>
                    View Details
                  </Link>
                </div>
              </div>

              <div className={styles.orderDetails}>
                <div className={styles.statusRow}>
                  <span className={`${styles.statusBadge} ${order.status === 'delivered' ? styles.statusDelivered : styles.statusProcessing}`}>
                    {order.status.toUpperCase()}
                  </span>
                  <p className={styles.statusText}>
                    {order.status === 'delivered' ? 'Delivered successfully' : 'Processing your order'}
                  </p>
                </div>

                <div className={styles.itemsList}>
                  {order.items && order.items.map((item, idx) => (
                    <div key={idx} className={styles.item}>
                      <img 
                        src={item.image || 'https://placehold.co/100x120?text=No+Image'} 
                        alt={item.name || 'Product'} 
                      />
                      <div className={styles.itemInfo}>
                        <h4>{item.name || 'Unknown Product'}</h4>
                        <p>Size: {item.size}</p>
                        <p>Qty: {item.qty}</p>
                      </div>
                      <div className={styles.itemActions}>
                        <Link href={item.productId ? `/product/${item.productId}` : '/'} className={styles.actionBtn}>
                          Buy Again
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
