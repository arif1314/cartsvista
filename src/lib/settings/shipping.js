export const DEFAULT_SHIPPING_SETTINGS = {
  defaultShippingAmount: 10,
  freeShippingThreshold: 100,
  insideDhakaAmount: 5,
  outsideDhakaAmount: 10,
};

export function normalizeShippingSettings(value = {}) {
  const rawDefault = Number(value.defaultShippingAmount ?? DEFAULT_SHIPPING_SETTINGS.defaultShippingAmount);
  const rawFreeThreshold = Number(value.freeShippingThreshold ?? DEFAULT_SHIPPING_SETTINGS.freeShippingThreshold);
  const rawInside = Number(value.insideDhakaAmount ?? DEFAULT_SHIPPING_SETTINGS.insideDhakaAmount);
  const rawOutside = Number(value.outsideDhakaAmount ?? DEFAULT_SHIPPING_SETTINGS.outsideDhakaAmount);

  if (
    rawDefault === 150 &&
    rawFreeThreshold === 10000 &&
    rawInside === 80 &&
    rawOutside === 150
  ) {
    return DEFAULT_SHIPPING_SETTINGS;
  }

  return {
    defaultShippingAmount: rawDefault,
    freeShippingThreshold: rawFreeThreshold,
    insideDhakaAmount: rawInside,
    outsideDhakaAmount: rawOutside,
  };
}

export function calculateShippingAmount(subtotal, city, settings) {
  if (subtotal >= settings.freeShippingThreshold) return 0;

  const normalizedCity = String(city || '').toLowerCase();
  if (normalizedCity.includes('dhaka')) {
    return settings.insideDhakaAmount;
  }

  return settings.outsideDhakaAmount || settings.defaultShippingAmount;
}
