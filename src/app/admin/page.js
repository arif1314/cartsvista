"use client";
import { useEffect, useState } from 'react';
import { TrendingUp, Users, ShoppingBag, DollarSign } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/format/currency';
import styles from './page.module.css';

export default function AdminDashboard() {
  const [data, setData] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    activeCustomers: 0,
    recentTransactions: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      const supabase = createClient();
      
      // Fetch Orders for revenue and order count
      const { data: orders } = await supabase
        .from('orders')
        .select('id, total_amount, created_at, status, shipping_address')
        .order('created_at', { ascending: false });

      // Fetch Customers count
      const { count: customersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'customer');

      let totalRevenue = 0;
      let totalOrders = 0;
      let recentTransactions = [];

      if (orders) {
        totalOrders = orders.length;
        // Calculate revenue (excluding cancelled orders)
        totalRevenue = orders
          .filter(o => o.status !== 'canceled' && o.status !== 'cancelled')
          .reduce((sum, o) => sum + Number(o.total_amount), 0);
        
        // Take top 5 recent transactions
        recentTransactions = orders.slice(0, 5).map(o => ({
          id: o.id.slice(0, 8),
          full_id: o.id,
          customer: `${o.shipping_address?.firstName || ''} ${o.shipping_address?.lastName || ''}`.trim() || 'Guest',
          date: new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          amount: formatCurrency(o.total_amount),
          status: o.status ? o.status.charAt(0).toUpperCase() + o.status.slice(1) : 'Pending'
        }));
      }

      setData({
        totalRevenue,
        totalOrders,
        activeCustomers: customersCount || 0,
        recentTransactions
      });
      setIsLoading(false);
    }

    fetchAnalytics();
  }, []);

  const stats = [
    { title: "Total Revenue", value: formatCurrency(data.totalRevenue), icon: DollarSign, trend: "+12.5%" },
    { title: "Total Orders", value: new Intl.NumberFormat('en-IN').format(data.totalOrders), icon: ShoppingBag, trend: "+8.2%" },
    { title: "Active Customers", value: new Intl.NumberFormat('en-IN').format(data.activeCustomers), icon: Users, trend: "+15.3%" },
    { title: "Conversion Rate", value: "3.24%", icon: TrendingUp, trend: "+1.1%" }, // Hardcoded for now
  ];

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard Overview</h1>
        <button className={styles.exportBtn}>Export Report</button>
      </div>

      <div className={styles.statsGrid}>
        {stats.map((stat, idx) => (
          <div key={idx} className={styles.statCard}>
            <div className={styles.statHeader}>
              <div className={styles.iconWrapper}>
                <stat.icon size={20} />
              </div>
              <span className={styles.trend}>{stat.trend}</span>
            </div>
            <div className={styles.statBody}>
              <h3>{isLoading ? '...' : stat.value}</h3>
              <p>{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.contentGrid}>
        <div className={styles.chartSection}>
          <div className={styles.sectionHeader}>
            <h3>Revenue Analytics</h3>
          </div>
          <div className={styles.chartPlaceholder}>
            <div className={styles.bars}>
              {[40, 70, 45, 90, 65, 85, 120].map((height, i) => (
                <div key={i} className={styles.barWrapper}>
                  <div className={styles.bar} style={{ height: `${height}%` }}></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.transactionsSection}>
          <div className={styles.sectionHeader}>
            <h3>Recent Transactions</h3>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td>
                  </tr>
                ) : data.recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No recent transactions.</td>
                  </tr>
                ) : (
                  data.recentTransactions.map((tx) => (
                    <tr key={tx.full_id}>
                      <td className={styles.fw500}>#{tx.id}</td>
                      <td>{tx.customer}</td>
                      <td className={styles.textMuted}>{tx.date}</td>
                      <td className={styles.fw500}>{tx.amount}</td>
                      <td>
                        <span className={`${styles.badge} ${styles['badge' + tx.status]}`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
