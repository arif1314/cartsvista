export const DEFAULT_STORE_SETTINGS = {
  storeName: 'CartsVista',
  tagline: 'Premium fashion and lifestyle commerce',
  supportEmail: 'support@cartsvista.com',
  supportPhone: '+880 1700-000000',
  address: 'Dhaka, Bangladesh',
  currency: 'USD',
};

export const DEFAULT_PAYMENT_SETTINGS = {
  cod: true,
  bkash: true,
  nagad: true,
  card: false,
  stripe: {
    enabled: false,
    mode: 'test',
    publishableKey: '',
    secretKey: '',
    webhookSecret: '',
    currency: 'usd',
    exchangeRate: 1,
  },
  instructions: {
    cod: 'Pay with cash when the order is delivered.',
    bkash: 'bKash payment will be confirmed manually after order placement.',
    nagad: 'Nagad payment will be confirmed manually after order placement.',
    card: 'Card gateway credentials can be connected when the provider account is ready.',
    stripe: 'Pay securely by card through Stripe Checkout.',
  },
};

export const DEFAULT_TAX_SETTINGS = {
  enabled: false,
  label: 'VAT',
  rate: 0,
};

export const DEFAULT_INVOICE_SETTINGS = {
  prefix: 'CV',
  footerNote: 'Thank you for shopping with CartsVista.',
  showSupportContact: true,
};

export const DEFAULT_NOTIFICATION_SETTINGS = {
  orderEmail: true,
  orderSms: false,
  adminEmail: '',
  emailProvider: 'resend',
  resendApiKey: '',
  emailFrom: 'CartsVista <onboarding@resend.dev>',
  smsProvider: 'twilio',
  twilioAccountSid: '',
  twilioAuthToken: '',
  twilioFromNumber: '',
};

function asNumber(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function asBoolean(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  return fallback;
}

function asText(value, fallback = '') {
  return String(value ?? fallback).trim();
}

export function normalizeStoreSettings(value = {}) {
  return {
    storeName: asText(value.storeName, DEFAULT_STORE_SETTINGS.storeName) || DEFAULT_STORE_SETTINGS.storeName,
    tagline: asText(value.tagline, DEFAULT_STORE_SETTINGS.tagline),
    supportEmail: asText(value.supportEmail, DEFAULT_STORE_SETTINGS.supportEmail),
    supportPhone: asText(value.supportPhone, DEFAULT_STORE_SETTINGS.supportPhone),
    address: asText(value.address, DEFAULT_STORE_SETTINGS.address),
    currency: 'USD',
  };
}

export function normalizePaymentSettings(value = {}) {
  const instructions = value.instructions || {};
  const stripe = value.stripe || {};
  return {
    cod: asBoolean(value.cod, DEFAULT_PAYMENT_SETTINGS.cod),
    bkash: asBoolean(value.bkash, DEFAULT_PAYMENT_SETTINGS.bkash),
    nagad: asBoolean(value.nagad, DEFAULT_PAYMENT_SETTINGS.nagad),
    card: asBoolean(value.card, DEFAULT_PAYMENT_SETTINGS.card),
    stripe: {
      enabled: asBoolean(stripe.enabled, DEFAULT_PAYMENT_SETTINGS.stripe.enabled),
      mode: ['test', 'live'].includes(stripe.mode) ? stripe.mode : DEFAULT_PAYMENT_SETTINGS.stripe.mode,
      publishableKey: asText(stripe.publishableKey, DEFAULT_PAYMENT_SETTINGS.stripe.publishableKey),
      secretKey: asText(stripe.secretKey, DEFAULT_PAYMENT_SETTINGS.stripe.secretKey),
      webhookSecret: asText(stripe.webhookSecret, DEFAULT_PAYMENT_SETTINGS.stripe.webhookSecret),
      currency: asText(stripe.currency, DEFAULT_PAYMENT_SETTINGS.stripe.currency).toLowerCase() || DEFAULT_PAYMENT_SETTINGS.stripe.currency,
      exchangeRate: Math.max(0.01, asNumber(stripe.exchangeRate, DEFAULT_PAYMENT_SETTINGS.stripe.exchangeRate)),
    },
    instructions: {
      cod: asText(instructions.cod, DEFAULT_PAYMENT_SETTINGS.instructions.cod),
      bkash: asText(instructions.bkash, DEFAULT_PAYMENT_SETTINGS.instructions.bkash),
      nagad: asText(instructions.nagad, DEFAULT_PAYMENT_SETTINGS.instructions.nagad),
      card: asText(instructions.card, DEFAULT_PAYMENT_SETTINGS.instructions.card),
      stripe: asText(instructions.stripe, DEFAULT_PAYMENT_SETTINGS.instructions.stripe),
    },
  };
}

export function normalizeTaxSettings(value = {}) {
  return {
    enabled: asBoolean(value.enabled, DEFAULT_TAX_SETTINGS.enabled),
    label: asText(value.label, DEFAULT_TAX_SETTINGS.label) || DEFAULT_TAX_SETTINGS.label,
    rate: Math.max(0, Math.min(100, asNumber(value.rate, DEFAULT_TAX_SETTINGS.rate))),
  };
}

export function normalizeInvoiceSettings(value = {}) {
  return {
    prefix: asText(value.prefix, DEFAULT_INVOICE_SETTINGS.prefix) || DEFAULT_INVOICE_SETTINGS.prefix,
    footerNote: asText(value.footerNote, DEFAULT_INVOICE_SETTINGS.footerNote),
    showSupportContact: asBoolean(value.showSupportContact, DEFAULT_INVOICE_SETTINGS.showSupportContact),
  };
}

export function normalizeNotificationSettings(value = {}) {
  return {
    orderEmail: asBoolean(value.orderEmail, DEFAULT_NOTIFICATION_SETTINGS.orderEmail),
    orderSms: asBoolean(value.orderSms, DEFAULT_NOTIFICATION_SETTINGS.orderSms),
    adminEmail: asText(value.adminEmail, DEFAULT_NOTIFICATION_SETTINGS.adminEmail),
    emailProvider: ['resend'].includes(value.emailProvider) ? value.emailProvider : DEFAULT_NOTIFICATION_SETTINGS.emailProvider,
    resendApiKey: asText(value.resendApiKey, DEFAULT_NOTIFICATION_SETTINGS.resendApiKey),
    emailFrom: asText(value.emailFrom, DEFAULT_NOTIFICATION_SETTINGS.emailFrom) || DEFAULT_NOTIFICATION_SETTINGS.emailFrom,
    smsProvider: ['twilio'].includes(value.smsProvider) ? value.smsProvider : DEFAULT_NOTIFICATION_SETTINGS.smsProvider,
    twilioAccountSid: asText(value.twilioAccountSid, DEFAULT_NOTIFICATION_SETTINGS.twilioAccountSid),
    twilioAuthToken: asText(value.twilioAuthToken, DEFAULT_NOTIFICATION_SETTINGS.twilioAuthToken),
    twilioFromNumber: asText(value.twilioFromNumber, DEFAULT_NOTIFICATION_SETTINGS.twilioFromNumber),
  };
}

export function calculateTaxAmount(amount, taxSettings) {
  if (!taxSettings.enabled || taxSettings.rate <= 0) return 0;
  return Math.round(amount * (taxSettings.rate / 100) * 100) / 100;
}

export function enabledPaymentMethods(paymentSettings) {
  const methods = Object.entries(paymentSettings)
    .filter(([key, enabled]) => ['cod', 'bkash', 'nagad', 'card'].includes(key) && enabled === true)
    .map(([key]) => key);

  if (paymentSettings.stripe?.enabled && paymentSettings.stripe?.secretKey) {
    methods.push('stripe');
  }

  return methods;
}

export function publicPaymentSettings(paymentSettings) {
  return {
    cod: paymentSettings.cod,
    bkash: paymentSettings.bkash,
    nagad: paymentSettings.nagad,
    card: paymentSettings.card,
    stripe: {
      enabled: Boolean(
        paymentSettings.stripe?.enabled &&
        paymentSettings.stripe?.publishableKey &&
        paymentSettings.stripe?.secretKey
      ),
      mode: paymentSettings.stripe?.mode || 'test',
      publishableKey: paymentSettings.stripe?.publishableKey || '',
      currency: paymentSettings.stripe?.currency || 'usd',
      exchangeRate: paymentSettings.stripe?.exchangeRate || 1,
    },
    instructions: paymentSettings.instructions,
  };
}
