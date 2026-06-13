import { NextResponse } from 'next/server';

export function proxy(request) {
  const host = request.headers.get('host') || '';
  const url = request.nextUrl.clone();
  const { pathname } = url;

  // Skip static assets, images, API routes, and other asset folders
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  // Admin Panel Port (3001)
  if (host.includes(':3001')) {
    // If accessing root, rewrite to /admin
    if (pathname === '/') {
      url.pathname = '/admin';
      return NextResponse.rewrite(url);
    }
  }

  // Customer Account Port (3002)
  if (host.includes(':3002')) {
    // If accessing root, rewrite to /account
    if (pathname === '/') {
      url.pathname = '/account';
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}
