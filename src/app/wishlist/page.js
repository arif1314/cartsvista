"use client";
import Link from 'next/link';
import { Heart, ShoppingBag } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import ProductCard from '@/components/ProductCard';
import styles from './page.module.css';

export default function WishlistPage() {
  const { wishlistItems, clearWishlist } = useWishlist();

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link> <span className={styles.separator}>/</span> 
          <span className={styles.current}>Wishlist</span>
        </div>
        <h1 className={styles.pageTitle}>Your Wishlist</h1>
        
        {wishlistItems.length > 0 && (
          <div className={styles.actionRow}>
            <p>{wishlistItems.length} {wishlistItems.length === 1 ? 'Item' : 'Items'}</p>
            <button onClick={clearWishlist} className={styles.clearBtn}>Clear All</button>
          </div>
        )}
      </div>

      {wishlistItems.length === 0 ? (
        <div className={styles.emptyState}>
          <Heart size={64} className={styles.emptyIcon} strokeWidth={1} />
          <h2>Your Wishlist is Empty</h2>
          <p>Save your favorite items here while you browse to easily find them later.</p>
          <Link href="/c/men" className={styles.continueBtn}>
            Discover Collection
          </Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {wishlistItems.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
