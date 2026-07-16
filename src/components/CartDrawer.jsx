"use client";
import { X, Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatCurrency } from '@/lib/format/currency';
import styles from './CartDrawer.module.css';
import Link from 'next/link';

export default function CartDrawer() {
  const { isCartOpen, setIsCartOpen, cartItems, removeFromCart, updateQuantity, cartTotal } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className={styles.overlay} onClick={() => setIsCartOpen(false)}>
      <div className={styles.drawer} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Shopping Bag ({cartItems.length})</h2>
          <button onClick={() => setIsCartOpen(false)} className={styles.closeBtn}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.itemsList}>
          {cartItems.length === 0 ? (
            <div className={styles.emptyCart}>
              <p>Your bag is empty</p>
              <button onClick={() => setIsCartOpen(false)} className={styles.continueBtn}>
                Continue Shopping
              </button>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={`${item.id}-${item.size}`} className={styles.cartItem}>
                <div className={styles.itemImage}>
                  <img src={item.image} alt={item.name} />
                </div>
                <div className={styles.itemDetails}>
                  <div className={styles.itemHeader}>
                    <h3>{item.name}</h3>
                    <button onClick={() => removeFromCart(item.id, item.size)} className={styles.removeBtn}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className={styles.itemSize}>Size: {item.size}</p>
                  <div className={styles.itemBottom}>
                    <div className={styles.quantityCtrl}>
                      <button onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}><Minus size={14} /></button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}><Plus size={14} /></button>
                    </div>
                    <p className={styles.itemPrice}>{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.totalRow}>
              <span>Subtotal</span>
              <span>{formatCurrency(cartTotal)}</span>
            </div>
            <p className={styles.taxesInfo}>Taxes and shipping calculated at checkout</p>
            <Link href="/checkout" className={styles.checkoutBtn} onClick={() => setIsCartOpen(false)}>
              Proceed to Checkout
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
