"use client";
import { use, useEffect, useState } from 'react';
import InvoiceDocument from '@/components/InvoiceDocument';

export default function AccountInvoicePage({ params }) {
  const { id } = use(params);
  const [invoice, setInvoice] = useState(null);
  const [settings, setSettings] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadInvoice() {
      try {
        const response = await fetch(`/api/account/orders/${id}/invoice`);
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || 'Unable to load invoice.');
        setInvoice(data.invoice);
        setSettings(data.settings);
      } catch (error) {
        setMessage(error.message);
      }
    }

    loadInvoice();
  }, [id]);

  if (message) return <p>{message}</p>;
  if (!invoice) return <p>Loading invoice...</p>;

  return (
    <InvoiceDocument invoice={invoice} settings={settings} backHref={`/account/orders/${id}`} />
  );
}
