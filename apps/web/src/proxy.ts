import { NextResponse, type NextRequest } from 'next/server';
import { isLocale, LOCALE_COOKIE, localizePath, stripLocale } from '@/lib/i18n';
export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const first = path.split('/')[1];
  const hasLocale = isLocale(first);
  const bare = stripLocale(path);
  if (/^\/(api|_next)(\/|$)/.test(bare)) return NextResponse.next();
  const operational = /^\/(admin|avaliar)(\/|$)/.test(bare);
  if (first === 'pt' || (operational && hasLocale)) {
    const url = new URL(request.url); url.pathname = bare;
    const response = NextResponse.redirect(url, 307); response.headers.set('Cache-Control', 'private, no-store'); return response;
  }
  if (!hasLocale && !operational) {
    const saved = request.cookies.get(LOCALE_COOKIE)?.value;
    if (isLocale(saved) && saved !== 'pt') {
      const url = new URL(request.url); url.pathname = localizePath(path, saved);
      const response = NextResponse.redirect(url, 307); response.headers.set('Cache-Control', 'private, no-store'); return response;
    }
  }
  const sensitive = /^\/(conta|admin|avaliar)(\/|$)/.test(bare) || /^\/produtos\/[^/]+\/?$/.test(bare);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete('Content-Security-Policy'); requestHeaders.delete('x-nonce');
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = `default-src 'self'; script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; media-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'`;
  if (sensitive) { requestHeaders.set('Content-Security-Policy', csp); requestHeaders.set('x-nonce', nonce); }
  const url = new URL(request.url);
  if (!hasLocale && !operational) url.pathname = `/pt${path === '/' ? '' : path}`;
  const response = !hasLocale && !operational ? NextResponse.rewrite(url, { request: { headers: requestHeaders } }) : NextResponse.next({ request: { headers: requestHeaders } });
  if (sensitive) response.headers.set('Content-Security-Policy', csp);
  if (sensitive || !hasLocale) response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
// Rotas sensíveis recebem nonce; páginas públicas estáticas conservam a CSP do next.config.
export const config = { matcher: ['/((?!api(?:/|$)|_next(?:/|$)|.*\\.).*)'] };
