"use client";
import Link from 'next/link';
import { Package, CreditCard, MapPin } from 'lucide-react';
import styles from './page.module.css';

export default function AccountOverview() {
  return (
    <div className={styles.overview}>
      <div className={styles.welcomeBox}>
        <h2>Welcome back, Shahria!</h2>
        <p>From your account dashboard, you can view your recent orders, manage your shipping and billing addresses, and edit your password and account details.</p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><Package size={24} /></div>
          <div className={styles.statInfo}>
            <h3>3</h3>
            <p>Total Orders</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><CreditCard size={24} /></div>
          <div className={styles.statInfo}>
            <h3>BDT 45,500</h3>
            <p>Total Spent</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><MapPin size={24} /></div>
          <div className={styles.statInfo}>
            <h3>2</h3>
            <p>Saved Addresses</p>
          </div>
        </div>
      </div>

      <div className={styles.recentOrder}>
        <div className={styles.sectionHeader}>
          <h3>Recent Order</h3>
          <Link href="/account/orders" className={styles.viewAllBtn}>View All</Link>
        </div>
        
        <div className={styles.orderCard}>
          <div className={styles.orderHeader}>
            <div>
              <p className={styles.label}>Order Number</p>
              <p className={styles.value}>#CV-9824</p>
            </div>
            <div>
              <p className={styles.label}>Date</p>
              <p className={styles.value}>Oct 24, 2023</p>
            </div>
            <div>
              <p className={styles.label}>Total Amount</p>
              <p className={styles.value}>BDT 12,500</p>
            </div>
            <div>
              <span className={`${styles.statusBadge} ${styles.statusProcessing}`}>Processing</span>
            </div>
          </div>
          
          <div className={styles.orderItems}>
            <div className={styles.item}>
              <img src="https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=200&auto=format&fit=crop" alt="Premium Panjabi" />
              <div className={styles.itemDetails}>
                <h4>Classic Midnight Panjabi</h4>
                <p>Size: 42 | Qty: 1</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
