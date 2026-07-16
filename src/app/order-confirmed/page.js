"use client";

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import styles from './page.module.css';

function OrderConfirmedContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <div className={styles.iconWrapper}>
        <CheckCircle size={40} />
      </div>
      
      <h1 className={styles.title}>Order Confirmed!</h1>
      
      <p className={styles.message}>
        Thank you for your purchase. Your order has been received and is currently being processed.
        {orderId && (
          <>
            <br />
            Your order number is: <span className={styles.orderId}>#{orderId}</span>
          </>
        )}
      </p>

      <p className={styles.message}>
        We have sent an order confirmation email with your order details and tracking information.
      </p>
      
      <div className={styles.actions}>
        <Link href="/" className={styles.primaryBtn}>
          Continue Shopping
        </Link>
        <Link href="/customer/orders" className={styles.secondaryBtn}>
          View My Orders
        </Link>
      </div>
    </>
  );
}

export default function OrderConfirmedPage() {
  return (
    <div className={styles.container}>
      <Suspense fallback={<div style={{textAlign: 'center', padding: '2rem'}}>Loading...</div>}>
        <OrderConfirmedContent />
      </Suspense>
    </div>
  );
}
