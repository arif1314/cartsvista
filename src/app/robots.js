import { absoluteUrl } from '@/lib/site/url';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/account/', '/api/', '/checkout/success', '/checkout/cancel'],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
