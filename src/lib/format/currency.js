export const STORE_CURRENCY = 'USD';

export function formatCurrency(amount) {
  const numericAmount = Number(amount || 0);

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: STORE_CURRENCY,
    maximumFractionDigits: Number.isInteger(numericAmount) ? 0 : 2,
  }).format(numericAmount);
}
