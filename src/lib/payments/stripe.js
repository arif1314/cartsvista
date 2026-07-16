const STRIPE_API_BASE = 'https://api.stripe.com/v1';
const STRIPE_API_VERSION = '2025-06-30.basil';
const ZERO_DECIMAL_CURRENCIES = new Set([
  'bif',
  'clp',
  'djf',
  'gnf',
  'jpy',
  'kmf',
  'krw',
  'mga',
  'pyg',
  'rwf',
  'ugx',
  'vnd',
  'vuv',
  'xaf',
  'xof',
  'xpf',
]);

function encodeForm(data, prefix = '') {
  const params = new URLSearchParams();

  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    const formKey = prefix ? `${prefix}[${key}]` : key;

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        const nested = encodeForm(item, `${formKey}[${index}]`);
        nested.forEach((nestedValue, nestedKey) => params.append(nestedKey, nestedValue));
      });
      return;
    }

    if (typeof value === 'object') {
      const nested = encodeForm(value, formKey);
      nested.forEach((nestedValue, nestedKey) => params.append(nestedKey, nestedValue));
      return;
    }

    params.append(formKey, String(value));
  });

  return params;
}

function stripeHeaders(secretKey) {
  return {
    Authorization: `Bearer ${secretKey}`,
    'Content-Type': 'application/x-www-form-urlencoded',
    'Stripe-Version': STRIPE_API_VERSION,
  };
}

export function stripeAmountFromStoreCurrency(amount, stripeSettings) {
  const currency = String(stripeSettings.currency || 'usd').toLowerCase();
  const exchangeRate = Number(stripeSettings.exchangeRate || 1);
  const converted = currency === 'usd' ? Number(amount) : Number(amount) * exchangeRate;
  const multiplier = ZERO_DECIMAL_CURRENCIES.has(currency) ? 1 : 100;
  return Math.max(1, Math.round(converted * multiplier));
}

export async function createStripeCheckoutSession({
  stripeSettings,
  order,
  items,
  successUrl,
  cancelUrl,
  customerEmail,
}) {
  const currency = String(stripeSettings.currency || 'usd').toLowerCase();
  const amount = stripeAmountFromStoreCurrency(order.total_amount, stripeSettings);
  const lineItemName = `CartsVista Order ${String(order.id).slice(0, 8).toUpperCase()}`;
  const description = items
    .map((item) => `${item.product_name} x ${item.quantity}`)
    .slice(0, 8)
    .join(', ');

  const body = encodeForm({
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: order.id,
    customer_email: customerEmail,
    payment_method_types: ['card'],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency,
          unit_amount: amount,
          product_data: {
            name: lineItemName,
            description: description || lineItemName,
          },
        },
      },
    ],
    metadata: {
      order_id: order.id,
      provider: 'stripe',
    },
    payment_intent_data: {
      metadata: {
        order_id: order.id,
        provider: 'stripe',
      },
    },
  });

  const response = await fetch(`${STRIPE_API_BASE}/checkout/sessions`, {
    method: 'POST',
    headers: stripeHeaders(stripeSettings.secretKey),
    body,
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'Unable to create Stripe Checkout session.');
  }

  return data;
}

export async function retrieveStripeCheckoutSession(secretKey, sessionId) {
  const response = await fetch(`${STRIPE_API_BASE}/checkout/sessions/${sessionId}`, {
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Stripe-Version': STRIPE_API_VERSION,
    },
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'Unable to retrieve Stripe Checkout session.');
  }

  return data;
}

async function hmacSha256Hex(secret, payload) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return result === 0;
}

export async function verifyStripeWebhookSignature(rawBody, signatureHeader, webhookSecret) {
  if (!webhookSecret) return { ok: false, error: 'Stripe webhook secret is not configured.' };
  if (!signatureHeader) return { ok: false, error: 'Missing Stripe signature header.' };

  const parts = signatureHeader.split(',').reduce((acc, item) => {
    const [key, value] = item.split('=');
    if (!acc[key]) acc[key] = [];
    acc[key].push(value);
    return acc;
  }, {});
  const timestamp = parts.t?.[0];
  const signatures = parts.v1 || [];

  if (!timestamp || signatures.length === 0) {
    return { ok: false, error: 'Invalid Stripe signature header.' };
  }

  const signedPayload = `${timestamp}.${rawBody}`;
  const expected = await hmacSha256Hex(webhookSecret, signedPayload);
  const matched = signatures.some((signature) => timingSafeEqual(signature, expected));

  return matched ? { ok: true } : { ok: false, error: 'Stripe signature verification failed.' };
}
