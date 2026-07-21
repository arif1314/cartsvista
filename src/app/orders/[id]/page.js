"use client";

import { use, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft, CreditCard, MapPin, Package } from 'lucide-react';
import { formatCurrency } from '@/lib/format/currency';
import styles from './page.module.css';

function formatDate(value) {
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function GuestOrderPage({ params }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const accessToken = searchParams.get('access') || '';
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadOrder() {
      if (!accessToken) {
        setError('This guest order link is incomplete.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/orders/${id}?access=${encodeURIComponent(accessToken)}`);
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || 'Unable to load this order.');
        setOrder(data.order);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadOrder();
  }, [accessToken, id]);

  if (isLoading) {
    return <main className={styles.statePage}>Loading your order…</main>;
  }

  if (!order) {
    return (
      <main className={styles.statePage}>
        <Package size={32} />
        <h1>Order unavailable</h1>
        <p>{error}</p>
        <Link href={`/orders/track?orderId=${encodeURIComponent(id)}`}>Verify order details</Link>
      </main>
    );
  }

  const address = order.shippingAddress || {};

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link href="/" className={styles.backLink}>
          <ChevronLeft size={16} /> Back to store
        </Link>

        <header className={styles.header}>
          <div>
            <span className={styles.eyebrow}>Guest order</span>
            <h1>Order #{order.id.slice(0, 8).toUpperCase()}</h1>
            <p>Placed on {formatDate(order.date)}</p>
          </div>
          <span className={styles.status}>{order.status}</span>
        </header>

        <div className={styles.layout}>
          <section className={styles.card}>
            <h2>Order items</h2>
            <div className={styles.items}>
              {order.items.map((item) => (
                <article key={item.id} className={styles.item}>
                  <div className={styles.itemImage}>
                    <Image src={item.image} alt={item.name} fill sizes="88px" />
                  </div>
                  <div className={styles.itemInfo}>
                    <h3>{item.name}</h3>
                    <p>Size: {item.size || '—'} · Color: {item.color || '—'}</p>
                    <p>Quantity: {item.qty}</p>
                  </div>
                  <strong>{formatCurrency(item.price * item.qty)}</strong>
                </article>
              ))}
            </div>
          </section>

          <aside className={styles.side}>
            <section className={styles.card}>
              <h2>Order summary</h2>
              <div className={styles.summaryRow}><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
              <div className={styles.summaryRow}><span>Shipping</span><span>{formatCurrency(order.shipping)}</span></div>
              {order.discount > 0 && <div className={styles.summaryRow}><span>Discount</span><span>-{formatCurrency(order.discount)}</span></div>}
              {order.tax > 0 && <div className={styles.summaryRow}><span>Tax</span><span>{formatCurrency(order.tax)}</span></div>}
              <div className={`${styles.summaryRow} ${styles.total}`}><span>Total</span><strong>{formatCurrency(order.total)}</strong></div>
            </section>

            <section className={styles.card}>
              <h2><MapPin size={17} /> Shipping address</h2>
              <address>
                <strong>{address.firstName} {address.lastName}</strong><br />
                {address.address}{address.apartment ? `, ${address.apartment}` : ''}<br />
                {address.city}{address.postalCode ? `, ${address.postalCode}` : ''}<br />
                {address.phone}<br />
                {address.email || order.customerEmail}
              </address>
            </section>

            <section className={styles.card}>
              <h2><CreditCard size={17} /> Payment</h2>
              <p className={styles.payment}>{order.paymentMethod || 'Not specified'} · {order.paymentStatus}</p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
