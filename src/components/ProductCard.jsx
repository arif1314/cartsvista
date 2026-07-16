import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Heart } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { formatCurrency } from '@/lib/format/currency';
import styles from './ProductCard.module.css';

export default function ProductCard({ product }) {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const isSaved = isInWishlist(product.id);

  return (
    <div className={styles.card}>
      <Link href={`/product/${product.id}`} className={styles.imageLink}>
        <div className={styles.imageContainer}>
          <img 
            src={product.image} 
            alt={product.name} 
            className={styles.image}
          />
          <button 
            className={`${styles.wishlistBtn} ${isSaved ? styles.wishlistBtnActive : ''}`} 
            onClick={(e) => { e.preventDefault(); toggleWishlist(product); }}
            aria-label="Toggle wishlist"
          >
            <Heart size={18} fill={isSaved ? "currentColor" : "none"} />
          </button>
          <div className={styles.quickAddOverlay}>
            <button className={styles.quickAddBtn} onClick={(e) => { e.preventDefault(); alert('Item added to cart!'); }}>
              <ShoppingBag size={16} /> Quick Add
            </button>
          </div>
        </div>
      </Link>
      
      <div className={styles.info}>
        <Link href={`/product/${product.id}`}>
          <h3 className={styles.title}>{product.name}</h3>
        </Link>
        <p className={styles.price}>{formatCurrency(product.price)}</p>
      </div>
    </div>
  );
}
