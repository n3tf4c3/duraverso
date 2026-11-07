import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy } from './proxy';
function request(path: string, locale?: string) {
  return new NextRequest(`https://duraverso.test${path}`, {
    headers: locale ? { cookie: `duraverso_locale=${locale}` } : {},
  });
}
describe('locale routing preserves security boundaries', () => {
  it('preserves the loopback origin with the configured Next URL normalization flag', () => {
    vi.stubEnv('__NEXT_NO_MIDDLEWARE_URL_NORMALIZE', '1');
    try {
      const response = proxy(new NextRequest('http://127.0.0.1:3107/produtos?q=Consul'));
      expect(response.headers.get('x-middleware-rewrite')).toBe('http://127.0.0.1:3107/pt/produtos?q=Consul');
    } finally {
      vi.unstubAllEnvs();
    }
  });
  it('rewrites Portuguese and redirects saved languages without losing filters', () => {
    expect(proxy(request('/produtos?q=CWH13AB&brand=Consul')).headers.get('x-middleware-rewrite')).toBe(
      'https://duraverso.test/pt/produtos?q=CWH13AB&brand=Consul',
    );
    const response = proxy(request('/produtos?q=CWH13AB&brand=Consul', 'es'));
    expect(response.headers.get('location')).toBe('https://duraverso.test/es/produtos?q=CWH13AB&brand=Consul');
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(proxy(request('/en/produtos', 'es')).headers.get('location')).toBeNull();
    expect(proxy(request('/produtos', 'invalid')).headers.get('x-middleware-rewrite')).toContain('/pt/produtos');
  });
  it('keeps API URLs independent of language and normalizes operational routes', () => {
    expect(proxy(request('/api/v1/products?q=7891129614529', 'en')).headers.get('location')).toBeNull();
    expect(proxy(request('/api/v1/products', 'es')).headers.get('x-middleware-rewrite')).toBeNull();
    expect(proxy(request('/admin', 'en')).headers.get('location')).toBeNull();
    expect(proxy(request('/es/avaliar/consul-cwh13ab')).headers.get('location')).toBe(
      'https://duraverso.test/avaliar/consul-cwh13ab',
    );
    expect(proxy(request('/pt/produtos?q=Consul')).headers.get('location')).toBe(
      'https://duraverso.test/produtos?q=Consul',
    );
  });
  it.each([
    '/conta',
    '/en/conta',
    '/es/conta',
    '/produtos/consul-cwh13ab',
    '/en/produtos/consul-cwh13ab',
    '/es/produtos/consul-cwh13ab',
    '/admin/catalogo',
    '/avaliar/consul-cwh13ab',
  ])('generates fresh nonces for %s and does not trust client headers', (path) => {
    const req = request(path);
    req.headers.set('x-nonce', 'attacker');
    req.headers.set('Content-Security-Policy', "script-src 'unsafe-inline'");
    const response = proxy(req);
    const csp = response.headers.get('content-security-policy')!;
    expect(csp).toContain("'strict-dynamic'");
    expect(csp).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+'/);
    expect(csp.split(';')[1]).not.toContain('unsafe-inline');
    expect(response.headers.get('x-middleware-request-x-nonce')).not.toBe('attacker');
    expect(response.headers.get('x-middleware-request-content-security-policy')).toBe(csp);
    expect(proxy(req).headers.get('content-security-policy')).not.toBe(csp);
    expect(response.headers.get('cache-control')).toContain('no-store');
  });
  it('leaves static pages without a request nonce or a reflected client CSP', () => {
    const req = request('/en');
    req.headers.set('x-nonce', 'attacker');
    req.headers.set('Content-Security-Policy', "script-src 'none'");
    const response = proxy(req);
    expect(response.headers.get('x-middleware-request-x-nonce')).toBeNull();
    expect(response.headers.get('x-middleware-request-content-security-policy')).toBeNull();
    expect(response.headers.get('content-security-policy')).toBeNull();
  });
});
