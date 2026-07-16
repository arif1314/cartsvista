export const SITE_URL = String(process.env.NEXT_PUBLIC_SITE_URL || 'https://cartsvista.com').replace(/\/$/, '');

export function absoluteUrl(path = '/') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${normalizedPath}`;
}
