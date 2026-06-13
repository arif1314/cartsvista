"use client";
import Link from 'next/link';
import { Home, MapPin, ShoppingBag, User } from 'lucide-react';
import styles from './MobileBottomNav.module.css';

export default function MobileBottomNav() {
  return (
    <nav className={styles.bottomNav}>
      <Link href="/" className={styles.navItem}>
        <Home size={22} strokeWidth={1.5} />
        <span>Home</span>
      </Link>
      <Link href="/locations" className={styles.navItem}>
        <MapPin size={22} strokeWidth={1.5} />
        <span>Store Locations</span>
      </Link>
      <Link href="/cart" className={styles.navItem}>
        <div className={styles.cartIconWrapper}>
          <ShoppingBag size={22} strokeWidth={1.5} />
          <span className={styles.badge}>1</span>
        </div>
        <span>Shopping Bag</span>
      </Link>
      <Link href="/login" className={styles.navItem}>
        <User size={22} strokeWidth={1.5} />
        <span>Account</span>
      </Link>
    </nav>
  );
}
