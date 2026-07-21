"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, Loader2 } from 'lucide-react';
import styles from './page.module.css';

export default function CheckoutSuccessPage() {
  const [status, setStatus] = useState('confirming');
  const [message, setMessage] = useState('Confirming your order...');
  const [orderAccess, setOrderAccess] = useState({ orderId: '', accessToken: '' });

  useEffect(() => {
    async function confirmPayment() {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get('session_id');
      const orderId = params.get('order_id') || '';
      const accessToken = params.get('access') || '';
      setOrderAccess({ orderId, accessToken });

      if (!sessionId) {
        if (orderId) {
          setStatus('confirmed');
          setMessage('Your order has been received and is now being processed.');
        } else {
          setStatus('error');
          setMessage('Order information was missing.');
        }
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

  const guestOrderHref = orderAccess.orderId && orderAccess.accessToken
    ? `/orders/${orderAccess.orderId}?access=${encodeURIComponent(orderAccess.accessToken)}`
    : orderAccess.orderId
      ? `/orders/track?orderId=${encodeURIComponent(orderAccess.orderId)}`
      : '/orders/track';

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        {status === 'confirming' ? <Loader2 className={styles.spin} size={42} /> : <CheckCircle size={42} />}
        <h1>Checkout Complete</h1>
        <p>{message}</p>
        <p className={styles.guestNote}>No account is required to view a guest order.</p>
        <div className={styles.actions}>
          <Link href={guestOrderHref}>View Order</Link>
          <Link href="/">Return to Store</Link>
        </div>
      </div>
    </main>
  );
}
