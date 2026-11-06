import assert from 'node:assert/strict';

// Read-only smoke check against the local preview started with pnpm web:start.
const origin = 'http://127.0.0.1:3107';
const catalogResponse = await fetch(`${origin}/api/v1/products`);
assert.equal(catalogResponse.status, 200);
const catalog = await catalogResponse.json();
assert.equal(catalog.mode, 'local_catalog', 'Run this check only against preview mode.');
const product = catalog.data.find((p) => p.confirmedGtins.length);
assert.ok(product);
let checked = 1;
for (const [prefix, language] of [['', 'pt-BR'], ['/en', 'en-US'], ['/es', 'es-ES']]) {
  for (const path of ['', '/produtos', '/scanner', '/como-funciona', '/regras', '/privacidade', '/conta', `/produtos/${product.slug}`]) {
    const response = await fetch(`${origin}${prefix}${path || '/'}`);
    assert.equal(response.status, 200, `${prefix}${path}`);
    const html = await response.text();
    assert.ok(html.includes(`lang="${language}"`), `Document language: ${prefix}${path}`);
    assert.ok(html.includes('language-trigger'), `Language switcher: ${prefix}${path}`);
    assert.ok(!html.includes('washer-illustration'), `Old illustration: ${prefix}${path}`);
    const csp = response.headers.get('content-security-policy') ?? '';
    assert.ok(csp.includes("frame-ancestors 'none'"));
    assert.equal(response.headers.get('permissions-policy'), 'camera=(self), microphone=(), geolocation=()');
    if (path === '/conta' || path.startsWith('/produtos/')) {
      const nonce = csp.match(/'nonce-([^']+)'/)?.[1];
      assert.ok(nonce, `Nonce: ${prefix}${path}`);
      assert.ok(html.includes(`nonce="${nonce}"`), `HTML uses matching nonce: ${prefix}${path}`);
      assert.ok(!csp.split(';').find((part) => part.trim().startsWith('script-src'))?.includes('unsafe-inline'));
    }
    if (path === '/conta') assert.ok(/<button[^>]*disabled/.test(html));
    if (path === '/privacidade') assert.ok(html.includes('duraverso_locale'));
    checked += 1;
  }
  const filtered = await fetch(`${origin}${prefix}/produtos?q=${product.model}&brand=${product.brand}`);
  assert.equal(filtered.status, 200);
  const filteredHtml = await filtered.text();
  assert.ok(filteredHtml.includes(`href="${prefix}/produtos/${product.slug}"`));
  assert.ok(filteredHtml.includes(`value="${product.brand}"`));
  const missing = await fetch(`${origin}${prefix}/produtos/not-a-real-product`);
  const missingHtml = await missing.text();
  // Next keeps HTTP 200 if loading.tsx has already started streaming.
  assert.ok(missing.status === 404 || (missing.status === 200 && missingHtml.includes('NEXT_HTTP_ERROR_FALLBACK;404')));
  assert.ok(/<meta name="robots" content="noindex/.test(missingHtml));
  assert.ok(missingHtml.includes(`lang="${language}"`));
  checked += 2;
}
const remembered = await fetch(`${origin}/produtos?q=${product.model}&brand=${product.brand}`, { redirect: 'manual', headers: { Cookie: 'duraverso_locale=es' } });
assert.equal(remembered.status, 307);
assert.equal(new URL(remembered.headers.get('location'), origin).href, `${origin}/es/produtos?q=${product.model}&brand=${product.brand}`);
assert.ok(remembered.headers.get('cache-control')?.includes('no-store'));
const portuguese = await fetch(`${origin}/produtos`, { redirect: 'manual', headers: { Cookie: 'duraverso_locale=pt' } });
assert.equal(portuguese.status, 200);
for (const code of catalog.data.flatMap((p) => p.confirmedGtins)) {
  const response = await fetch(`${origin}/api/v1/products?q=${code}`, { headers: { Cookie: 'duraverso_locale=en' } });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.ok(body.data.some((p) => p.confirmedGtins.includes(code)));
  checked += 1;
}
for (const route of ['/admin', '/admin/catalogo', `/avaliar/${product.slug}`]) {
  const response = await fetch(`${origin}${route}`, { redirect: 'manual', headers: { Cookie: 'duraverso_locale=en' } });
  assert.equal(response.status, 200);
  assert.ok(response.headers.get('content-security-policy')?.includes("'nonce-"));
  const html = await response.text();
  assert.ok(!html.includes('<form'), 'Preview operations must not expose forms.');
  checked += 1;
}
console.log(`Preview smoke passed: ${checked + 2} checks; three languages, disabled accounts, API, filters, all documented codes and nonce CSP.`);
