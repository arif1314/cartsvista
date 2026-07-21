import { SITE_URL, absoluteUrl } from '@/lib/site/url';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/admin',
          '/account/',
          '/account',
          '/api/',
          '/checkout/',
          '/checkout',
          '/login',
          '/wishlist',
          '/orders/',
          '/orders',
          '/order-confirmed',
        ],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: SITE_URL,
  };
}
