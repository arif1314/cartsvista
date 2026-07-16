function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function safeNumber(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function safeText(value, maxLength = 500) {
  return String(value || '').trim().slice(0, maxLength);
}

export function parseCheckoutPayload(body) {
  const cartItems = Array.isArray(body.cartItems) ? body.cartItems : [];
  const paymentMethod = safeText(body.paymentMethod || 'cod', 40);
  const couponCode = safeText(body.couponCode, 60).toUpperCase();
  const shippingAddress = body.shippingAddress || {};

  const address = {
    email: safeText(shippingAddress.email, 160).toLowerCase(),
    firstName: safeText(shippingAddress.firstName, 80),
    lastName: safeText(shippingAddress.lastName, 80),
    address: safeText(shippingAddress.address, 240),
    apartment: safeText(shippingAddress.apartment, 120),
    city: safeText(shippingAddress.city, 80),
    postalCode: safeText(shippingAddress.postalCode, 40),
    phone: safeText(shippingAddress.phone, 40),
  };

  const items = cartItems
    .map((item) => ({
      productId: safeText(item.id, 80),
      isUuidProduct: isUuid(item.id),
      name: safeText(item.name, 160),
      quantity: Math.max(1, Math.min(99, Math.floor(safeNumber(item.quantity, 1)))),
      size: safeText(item.size, 40),
      color: safeText(item.color, 40) || null,
      clientPrice: Math.max(0, safeNumber(item.price, 0)),
    }))
    .filter((item) => item.name && item.quantity > 0);

  const errors = {};
  if (items.length === 0) errors.cartItems = 'Cart cannot be empty.';
  if (!address.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email)) errors.email = 'Valid email is required.';
  if (!address.firstName) errors.firstName = 'First name is required.';
  if (!address.lastName) errors.lastName = 'Last name is required.';
  if (!address.address) errors.address = 'Address is required.';
  if (!address.city) errors.city = 'City is required.';
  if (!address.phone) errors.phone = 'Phone number is required.';

  return {
    checkout: {
      items,
      shippingAddress: address,
      paymentMethod,
      couponCode,
    },
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}
