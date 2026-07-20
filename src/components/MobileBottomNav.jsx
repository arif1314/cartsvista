"use client";
import Link from 'next/link';
import { Home, MapPin, ShoppingBag, User } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import styles from './MobileBottomNav.module.css';

export default function MobileBottomNav() {
  const { cartCount, setIsCartOpen } = useCart();

  return (
    <nav className={styles.bottomNav}>
      <Link href="/" className={styles.navItem}>
        <Home size={22} strokeWidth={1.5} />
        <span>Home</span>
      </Link>
      <Link href="/store-locations" className={styles.navItem}>
        <MapPin size={22} strokeWidth={1.5} />
        <span>Store Locations</span>
      </Link>
      <button type="button" className={styles.navItem} onClick={() => setIsCartOpen(true)}>
        <div className={styles.cartIconWrapper}>
          <ShoppingBag size={22} strokeWidth={1.5} />
          {cartCount > 0 && <span className={styles.badge}>{cartCount}</span>}
        </div>
        <span>Shopping Bag</span>
      </button>
      <Link href="/account" className={styles.navItem}>
        <User size={22} strokeWidth={1.5} />
        <span>Account</span>
      </Link>
    </nav>
  );
}
