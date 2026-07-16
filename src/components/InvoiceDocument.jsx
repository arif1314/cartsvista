"use client";
import Link from 'next/link';
import { formatCurrency } from '@/lib/format/currency';
import styles from './InvoiceDocument.module.css';

export default function InvoiceDocument({ invoice, settings, backHref }) {
  const store = settings?.store || {};
  const invoiceSettings = settings?.invoice || {};
  const taxSettings = settings?.tax || {};
  const storeName = store.storeName || 'CartsVista';

  return (
    <main className={styles.page}>
      <div className={styles.toolbar}>
        <Link href={backHref} className={styles.button}>Back</Link>
        <button className={styles.button} onClick={() => window.print()}>Print / Save PDF</button>
      </div>

      <div className={styles.header}>
        <div>
          <h1 className={styles.brand}>{storeName}</h1>
          <p>{store.tagline || 'Premium fashion and lifestyle commerce'}</p>
          {invoiceSettings.showSupportContact && (
            <p>{store.supportEmail || ''} {store.supportPhone ? `| ${store.supportPhone}` : ''}</p>
          )}
          {store.address && <p>{store.address}</p>}
        </div>
        <div className={styles.meta}>
          <p>Invoice #{invoiceSettings.prefix || 'CV'}-{invoice.id.slice(0, 8).toUpperCase()}</p>
          <p>{new Date(invoice.date).toLocaleDateString()}</p>
          <p>Payment: {invoice.paymentStatus}</p>
        </div>
      </div>

      <section className={styles.section}>
        <h3>Bill To</h3>
        <p>{invoice.shippingAddress?.firstName} {invoice.shippingAddress?.lastName}</p>
        <p>{invoice.customerEmail || invoice.shippingAddress?.email}</p>
        <p>{invoice.shippingAddress?.address}, {invoice.shippingAddress?.city}</p>
        <p>{invoice.shippingAddress?.phone}</p>
      </section>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.qty}</td>
              <td>{formatCurrency(item.price)}</td>
              <td>{formatCurrency(item.price * item.qty)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={styles.totals}>
        <div className={styles.totalRow}><span>Subtotal</span><span>{formatCurrency(invoice.subtotal)}</span></div>
        {invoice.discount > 0 && (
          <div className={styles.totalRow}><span>Discount</span><span>- {formatCurrency(invoice.discount)}</span></div>
        )}
        <div className={styles.totalRow}><span>Shipping</span><span>{formatCurrency(invoice.shipping)}</span></div>
        {invoice.tax > 0 && (
          <div className={styles.totalRow}><span>{taxSettings.label || 'Tax'}</span><span>{formatCurrency(invoice.tax)}</span></div>
        )}
        <div className={`${styles.totalRow} ${styles.grandTotal}`}><span>Total</span><span>{formatCurrency(invoice.total)}</span></div>
      </div>

      {invoiceSettings.footerNote && (
        <p className={styles.footerNote}>{invoiceSettings.footerNote}</p>
      )}
    </main>
  );
}
