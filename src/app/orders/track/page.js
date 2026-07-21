"use client";

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, PackageSearch } from 'lucide-react';
import styles from './page.module.css';

function TrackOrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get('orderId') || '');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/orders/guest-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, email }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Unable to find this order.');
      }

      router.push(`/orders/${data.orderId}?access=${encodeURIComponent(data.accessToken)}`);
    } catch (submitError) {
      setError(submitError.message);
      setIsLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <Link href="/" className={styles.backLink}>
          <ChevronLeft size={16} /> Back to store
        </Link>
        <div className={styles.icon}><PackageSearch size={28} /></div>
        <span className={styles.eyebrow}>Guest checkout</span>
        <h1>Track Your Order</h1>
        <p>Enter the complete order number and the email used at checkout. No account or password is required.</p>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <label>
            <span>Order number</span>
            <input
              value={orderId}
              onChange={(event) => setOrderId(event.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              autoComplete="off"
              required
            />
          </label>
          <label>
            <span>Checkout email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Finding order…' : 'View order'}
          </button>
        </form>

        <p className={styles.accountLink}>
          Have an account? <Link href="/login">Sign in</Link>
        </p>
      </section>
    </main>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<main className={styles.page}>Loading…</main>}>
      <TrackOrderForm />
    </Suspense>
  );
}
