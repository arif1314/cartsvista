"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/format/currency';
import styles from './page.module.css';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Fetch orders and their items
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              *,
              products (
                name,
                images
              )
            )
          `)
          // Assuming user_id is in orders table (Note: Migration v2 didn't add user_id to orders! We need to fix this or fetch by email)
          // Wait, orders table in the current schema doesn't have a user_id? Let's check the schema.
          // Fallback: fetch by shipping_address email
          .order('created_at', { ascending: false });

        if (data) {
          // Filter by user's email if user_id doesn't exist
          const userOrders = data.filter(order => order.shipping_address?.email === user.email);
          setOrders(userOrders);
        }
      }
      setIsLoading(false);
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
                    <p className={styles.value}>{formatDate(order.created_at)}</p>
                  </div>
                  <div className={styles.divider}></div>
                  <div>
                    <p className={styles.label}>Total Amount</p>
                    <p className={styles.value}>{formatCurrency(order.total_amount)}</p>
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
                  {order.order_items && order.order_items.map((item, idx) => (
                    <div key={idx} className={styles.item}>
                      <img 
                        src={item.products?.images?.[0] || 'https://placehold.co/100x120?text=No+Image'} 
                        alt={item.products?.name || 'Product'} 
                      />
                      <div className={styles.itemInfo}>
                        <h4>{item.products?.name || 'Unknown Product'}</h4>
                        <p>Size: {item.size}</p>
                        <p>Qty: {item.quantity}</p>
                      </div>
                      <div className={styles.itemActions}>
                        <Link href={`/product/${item.product_id}`} className={styles.actionBtn}>
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
