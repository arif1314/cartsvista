export function normalizeCouponPayload(body) {
  const code = String(body.code || '').trim().toUpperCase().replace(/\s+/g, '');
  const discountType = body.discountType || body.discount_type;
  const discountValue = Number(body.discountValue ?? body.discount_value);
  const minOrderAmount = Number(body.minOrderAmount ?? body.min_order_amount ?? 0);
  const maxDiscountAmountRaw = body.maxDiscountAmount ?? body.max_discount_amount;
  const maxDiscountAmount = maxDiscountAmountRaw === '' || maxDiscountAmountRaw == null
    ? null
    : Number(maxDiscountAmountRaw);
  const usageLimitRaw = body.usageLimit ?? body.usage_limit;
  const usageLimit = usageLimitRaw === '' || usageLimitRaw == null
    ? null
    : Number(usageLimitRaw);

  const errors = {};
  if (!code) errors.code = 'Coupon code is required.';
  if (!['fixed', 'percentage'].includes(discountType)) errors.discountType = 'Discount type must be fixed or percentage.';
  if (!Number.isFinite(discountValue) || discountValue < 0) errors.discountValue = 'Valid discount value is required.';
  if (discountType === 'percentage' && discountValue > 100) errors.discountValue = 'Percentage discount cannot exceed 100.';
  if (!Number.isFinite(minOrderAmount) || minOrderAmount < 0) errors.minOrderAmount = 'Minimum order must be valid.';
  if (maxDiscountAmount !== null && (!Number.isFinite(maxDiscountAmount) || maxDiscountAmount < 0)) errors.maxDiscountAmount = 'Max discount must be valid.';
  if (usageLimit !== null && (!Number.isInteger(usageLimit) || usageLimit < 1)) errors.usageLimit = 'Usage limit must be a positive whole number.';

  return {
    coupon: {
      code,
      description: String(body.description || '').trim() || null,
      discount_type: discountType,
      discount_value: discountValue,
      min_order_amount: minOrderAmount,
      max_discount_amount: maxDiscountAmount,
      starts_at: body.startsAt || body.starts_at || null,
      ends_at: body.endsAt || body.ends_at || null,
      usage_limit: usageLimit,
      is_active: body.isActive ?? body.is_active ?? true,
    },
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}
