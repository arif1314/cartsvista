"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, CreditCard, MapPin } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/format/currency';
import styles from './page.module.css';

export default function AccountOverview() {
  const [data, setData] = useState({
    profile: null,
    orders: [],
    addressCount: 0,
    totalSpent: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Fetch Profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        // Fetch Orders and calculate stats
        const { data: orders } = await supabase
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
          .order('created_at', { ascending: false });

        const userOrders = orders?.filter(o => o.shipping_address?.email === user.email) || [];
        const totalSpent = userOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);

        // Fetch Addresses
        const { count } = await supabase
          .from('user_addresses')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        setData({
          profile,
          orders: userOrders,
          addressCount: count || 0,
          totalSpent
        });
      }
      setIsLoading(false);
    }
    fetchData();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const latestOrder = data.orders.length > 0 ? data.orders[0] : null;

  if (isLoading) return <div>Loading dashboard...</div>;

  return (
    <div className={styles.overview}>
      <div className={styles.welcomeBox}>
        <h2>Welcome back, {data.profile?.full_name?.split(' ')[0] || 'User'}!</h2>
        <p>From your account dashboard, you can view your recent orders, manage your shipping and billing addresses, and edit your password and account details.</p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><Package size={24} /></div>
          <div className={styles.statInfo}>
            <h3>{data.orders.length}</h3>
            <p>Total Orders</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><CreditCard size={24} /></div>
          <div className={styles.statInfo}>
            <h3>{formatCurrency(data.totalSpent)}</h3>
            <p>Total Spent</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><MapPin size={24} /></div>
          <div className={styles.statInfo}>
            <h3>{data.addressCount}</h3>
            <p>Saved Addresses</p>
          </div>
        </div>
      </div>

      <div className={styles.recentOrder}>
        <div className={styles.sectionHeader}>
          <h3>Recent Order</h3>
          <Link href="/account/orders" className={styles.viewAllBtn}>View All</Link>
        </div>
        
        {latestOrder ? (
          <div className={styles.orderCard}>
            <div className={styles.orderHeader}>
              <div>
                <p className={styles.label}>Order Number</p>
                <p className={styles.value}>#{latestOrder.id.slice(0, 8)}</p>
              </div>
              <div>
                <p className={styles.label}>Date</p>
                <p className={styles.value}>{formatDate(latestOrder.created_at)}</p>
              </div>
              <div>
                <p className={styles.label}>Total Amount</p>
                <p className={styles.value}>{formatCurrency(latestOrder.total_amount)}</p>
              </div>
              <div>
                <span className={`${styles.statusBadge} ${latestOrder.status === 'delivered' ? styles.statusDelivered : styles.statusProcessing}`}>
                  {latestOrder.status.toUpperCase()}
                </span>
              </div>
            </div>
            
            <div className={styles.orderItems}>
              {latestOrder.order_items?.map((item, idx) => (
                <div key={idx} className={styles.item}>
                  <img 
                    src={item.products?.images?.[0] || 'https://placehold.co/100x120?text=No+Image'} 
                    alt={item.products?.name || 'Product'} 
                  />
                  <div className={styles.itemDetails}>
                    <h4>{item.products?.name || 'Unknown Product'}</h4>
                    <p>Size: {item.size} | Qty: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ padding: '2rem', border: '1px solid #eaeaea', borderRadius: '8px', textAlign: 'center' }}>
            <p>No recent orders found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
