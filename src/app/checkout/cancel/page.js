"use client";
import Link from 'next/link';
import { XCircle } from 'lucide-react';
import styles from '../success/page.module.css';

export default function CheckoutCancelPage() {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <XCircle size={42} />
        <h1>Payment Canceled</h1>
        <p>Your Stripe payment was canceled. The order is still pending until payment is completed or reviewed by the store team.</p>
        <div className={styles.actions}>
          <Link href="/checkout">Try Again</Link>
          <Link href="/">Return to Store</Link>
        </div>
      </div>
    </main>
  );
}
