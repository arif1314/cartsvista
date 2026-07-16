export const PRODUCT_STATUSES = ['draft', 'published', 'archived'];

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

function toNumber(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function toStringArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export function slugifyProductName(name) {
  return String(name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function parseProductPayload(body) {
  const name = String(body.name || '').trim();
  const category = String(body.category || '').trim();
  const price = toNumber(body.price, NaN);
  const stock = Math.max(0, Math.floor(toNumber(body.stock, 0)));
  const status = PRODUCT_STATUSES.includes(body.status) ? body.status : 'published';

  const errors = {};
  if (!name) errors.name = 'Product name is required.';
  if (!category) errors.category = 'Category is required.';
  if (!Number.isFinite(price) || price < 0) errors.price = 'Valid price is required.';

  const images = toStringArray(body.images);
  const sizes = toStringArray(body.sizes);
  const colors = toStringArray(body.colors);

  const product = {
    name,
    slug: body.slug ? slugifyProductName(body.slug) : slugifyProductName(name),
    description: String(body.description || '').trim() || null,
    price,
    discount_price:
      body.discountPrice || body.discount_price
        ? Math.max(0, toNumber(body.discountPrice || body.discount_price, 0))
        : null,
    category,
    category_id: isUuid(body.categoryId || body.category_id) ? body.categoryId || body.category_id : null,
    subcategory: String(body.subcategory || '').trim() || null,
    brand_id: isUuid(body.brandId || body.brand_id) ? body.brandId || body.brand_id : null,
    images:
      images.length > 0
        ? images
        : ['https://images.unsplash.com/photo-1593030103066-0093718efeb9?q=80&w=600&auto=format&fit=crop'],
    sizes: sizes.length > 0 ? sizes : ['S', 'M', 'L'],
    colors,
    stock,
    status,
    sku: String(body.sku || '').trim() || null,
  };

  return {
    product,
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

export function productToClient(product) {
  return {
    ...product,
    categoryId: product.category_id || '',
    brandId: product.brand_id || '',
    categoryName: product.categories?.name || product.category || '',
    categorySlug: product.categories?.slug || '',
    brandName: product.brands?.name || '',
    brandSlug: product.brands?.slug || '',
    image: product.images && product.images.length > 0
      ? product.images[0]
      : 'https://placehold.co/600x800?text=No+Image',
    stockMovements: (product.stock_movements || []).map((movement) => ({
      id: movement.id,
      type: movement.movement_type,
      delta: movement.delta,
      previousStock: movement.previous_stock,
      newStock: movement.new_stock,
      note: movement.note || '',
      orderId: movement.order_id || '',
      createdAt: movement.created_at,
    })),
  };
}
