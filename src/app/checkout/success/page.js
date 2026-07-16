"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, Loader2 } from 'lucide-react';
import styles from './page.module.css';

export default function CheckoutSuccessPage() {
  const [status, setStatus] = useState('confirming');
  const [message, setMessage] = useState('Confirming your Stripe payment...');

  useEffect(() => {
    async function confirmPayment() {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get('session_id');

      if (!sessionId) {
        setStatus('error');
        setMessage('Stripe session ID was missing.');
        return;
      }

      try {
        const response = await fetch(`/api/payments/stripe/confirm?session_id=${encodeURIComponent(sessionId)}`);
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || 'Unable to confirm payment.');

        setStatus(data.payment?.paid ? 'paid' : 'pending');
        setMessage(data.payment?.paid
          ? 'Payment confirmed. Your order is now confirmed.'
          : 'Payment is still pending. We will update your order after Stripe confirms it.');
      } catch (error) {
        setStatus('error');
        setMessage(error.message);
      }
    }

    confirmPayment();
  }, []);

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        {status === 'confirming' ? <Loader2 className={styles.spin} size={42} /> : <CheckCircle size={42} />}
        <h1>Checkout Complete</h1>
        <p>{message}</p>
        <div className={styles.actions}>
          <Link href="/account/orders">View Orders</Link>
          <Link href="/">Return to Store</Link>
        </div>
      </div>
    </main>
  );
}
