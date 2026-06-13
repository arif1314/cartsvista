"use client";
import { TrendingUp, Users, ShoppingBag, DollarSign } from 'lucide-react';
import styles from './page.module.css';

export default function AdminDashboard() {
  const stats = [
    { title: "Total Revenue", value: "BDT 458,500", icon: DollarSign, trend: "+12.5%" },
    { title: "Total Orders", value: "1,245", icon: ShoppingBag, trend: "+8.2%" },
    { title: "Active Customers", value: "854", icon: Users, trend: "+15.3%" },
    { title: "Conversion Rate", value: "3.24%", icon: TrendingUp, trend: "+1.1%" },
  ];

  const recentTransactions = [
    { id: "#CV-9824", customer: "Shahria Arif", date: "Oct 24, 2023", amount: "BDT 12,500", status: "Processing" },
    { id: "#CV-9823", customer: "Ayesha Rahman", date: "Oct 24, 2023", amount: "BDT 8,000", status: "Shipped" },
    { id: "#CV-9822", customer: "Karim Uddin", date: "Oct 23, 2023", amount: "BDT 22,500", status: "Delivered" },
    { id: "#CV-9821", customer: "Nusrat Jahan", date: "Oct 23, 2023", amount: "BDT 15,000", status: "Delivered" },
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
              <h3>{stat.value}</h3>
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
                {recentTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className={styles.fw500}>{tx.id}</td>
                    <td>{tx.customer}</td>
                    <td className={styles.textMuted}>{tx.date}</td>
                    <td className={styles.fw500}>{tx.amount}</td>
                    <td>
                      <span className={`${styles.badge} ${styles['badge' + tx.status]}`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
