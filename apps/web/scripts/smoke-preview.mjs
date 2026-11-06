import assert from 'node:assert/strict';

// Read-only smoke check against the local preview started with pnpm web:start.
const origin = 'http://127.0.0.1:3107';
const catalogResponse = await fetch(`${origin}/api/v1/products`);
assert.equal(catalogResponse.status, 200);
const catalog = await catalogResponse.json();
assert.equal(catalog.mode, 'local_catalog', 'Run this check only against preview mode.');
const product = catalog.data.find((p) => p.confirmedGtins.length);
assert.ok(product);
const categories = ['washing_machine', 'refrigerator', 'microwave', 'stove', 'freezer', 'oven',
  'cooktop', 'dishwasher', 'air_fryer', 'blender', 'vacuum_cleaner', 'coffee_maker', 'air_conditioner'];
const categoryOf = (item) => item.category ?? 'washing_machine';
assert.deepEqual([...new Set(catalog.data.map(categoryOf))].sort(), [...categories].sort());
let checked = 1;
for (const category of categories) {
  const expected = catalog.data.filter((item) => categoryOf(item) === category);
  const response = await fetch(`${origin}/api/v1/products?category=${category}`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.data.map((item) => item.slug).sort(), expected.map((item) => item.slug).sort());
  assert.equal(body.total, expected.length);
  const example = expected[0];
  assert.ok(example, `Category has documented models: ${category}`);
  const combinedQuery = new URLSearchParams({ category, brand: example.brand, q: example.model });
  const combined = await fetch(`${origin}/api/v1/products?${combinedQuery}`);
  assert.equal(combined.status, 200);
  assert.deepEqual((await combined.json()).data.map((item) => item.slug), [example.slug]);
  if (category !== 'washing_machine') {
    assert.ok(expected.every((item) => !Object.hasOwn(item, 'capacityKg')), 'Never label another appliance in kg.');
    const kgFilter = await fetch(`${origin}/api/v1/products?category=${category}&capacity=large`);
    assert.equal(kgFilter.status, 200);
    assert.equal((await kgFilter.json()).total, 0, 'Kg filter never matches liters or burners.');
    checked += 1;
  }
  checked += 2;
}
const invalidCategory = await fetch(`${origin}/api/v1/products?category=unsupported`);
assert.equal(invalidCategory.status, 400);
checked += 1;
for (const q of ['12000 BTU', '12.000 BTU/h', '12,000 BTU/h']) {
  const response = await fetch(`${origin}/api/v1/products?${new URLSearchParams({ q, category: 'air_conditioner' })}`);
  assert.equal(response.status, 200);
  const body = await response.json();
  const expected = catalog.data.filter((item) => item.category === 'air_conditioner' && item.coolingCapacityBtuH === 12000);
  assert.ok(expected.length > 0);
  assert.deepEqual(body.data.map((item) => item.slug).sort(), expected.map((item) => item.slug).sort());
  checked += 1;
}
const brands = [...new Set(catalog.data.map((item) => item.brand))];
const airConditionerBrands = [...new Set(catalog.data.filter((item) => item.category === 'air_conditioner').map((item) => item.brand))];
for (const brand of brands) {
  const response = await fetch(`${origin}/api/v1/products?${new URLSearchParams({ brand })}`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.data.map((item) => item.slug).sort(), catalog.data.filter((item) => item.brand === brand).map((item) => item.slug).sort());
  checked += 1;
}
for (const query of ['RI2244/90', 'RI2244-90', 'RI224490']) {
  const response = await fetch(`${origin}/api/v1/products?${new URLSearchParams({ q: query })}`);
  assert.equal(response.status, 200);
  assert.ok((await response.json()).data.some((item) => item.model === 'RI2244/90'));
  checked += 1;
}
const decimalQuery = await fetch(`${origin}/api/v1/products?${new URLSearchParams({ q: '3,2 L', category: 'air_fryer' })}`);
assert.equal(decimalQuery.status, 200);
assert.ok((await decimalQuery.json()).data.some((item) => item.model === 'EAF10'));
checked += 1;
for (const [prefix, language] of [['', 'pt-BR'], ['/en', 'en-US'], ['/es', 'es-ES']]) {
  for (const brand of airConditionerBrands) {
    const expected = catalog.data.filter((item) => item.brand === brand && item.category === 'air_conditioner');
    assert.ok(expected.length > 0, `Documented brand: ${brand}`);
    const listing = await fetch(`${origin}${prefix}/produtos?${new URLSearchParams({ brand, category: 'air_conditioner' })}`);
    assert.equal(listing.status, 200);
    const html = await listing.text();
    for (const item of expected) assert.ok(html.includes(`href="${prefix}/produtos/${item.slug}"`));
    const example = expected[0];
    const detail = await fetch(`${origin}${prefix}/produtos/${example.slug}`);
    assert.equal(detail.status, 200);
    const detailHtml = await detail.text();
    assert.ok(detailHtml.includes(example.model));
    assert.ok(detailHtml.includes(`${new Intl.NumberFormat(language).format(example.coolingCapacityBtuH)} BTU/h`));
    assert.ok(detailHtml.includes(example.sourceUrl.replaceAll('&', '&amp;')));
    checked += 2;
  }
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
    if (path === '') {
      for (const category of categories) assert.ok(html.includes(`href="${prefix}/produtos?category=${category}"`));
      for (const brand of brands) assert.ok(html.includes(`href="${prefix}/produtos?brand=${encodeURIComponent(brand)}"`));
    }
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
  for (const category of categories) {
    const expected = catalog.data.filter((item) => categoryOf(item) === category);
    const excluded = catalog.data.find((item) => categoryOf(item) !== category);
    const response = await fetch(`${origin}${prefix}/produtos?category=${category}`);
    assert.equal(response.status, 200);
    const html = await response.text();
    for (const item of expected) assert.ok(html.includes(`href="${prefix}/produtos/${item.slug}"`), `Visible ${category}: ${item.slug}`);
    assert.ok(!html.includes(`href="${prefix}/produtos/${excluded.slug}"`), `Category excludes ${excluded.slug}`);
    const example = expected[0];
    const detail = await fetch(`${origin}${prefix}/produtos/${example.slug}`);
    assert.equal(detail.status, 200);
    const detailHtml = await detail.text();
    assert.ok(detailHtml.includes(example.model));
    assert.ok(detailHtml.includes(`lang="${language}"`));
    const nonce = detail.headers.get('content-security-policy')?.match(/'nonce-([^']+)'/)?.[1];
    assert.ok(nonce && detailHtml.includes(`nonce="${nonce}"`));
    assert.ok(!/(?:undefined|NaN) (?:kg|L|W|bocas|burners|quemadores|servi)/.test(detailHtml), 'No undefined measure in detail.');
    const format = (value) => new Intl.NumberFormat(language, { maximumFractionDigits: 2 }).format(value);
    if (example.capacityLiters) assert.ok(detailHtml.includes(`${format(example.capacityLiters)} L`), 'Volume is rendered in localized liters.');
    if (example.powerWatts) assert.ok(detailHtml.includes(`${format(example.powerWatts)} W`), 'Electrical power is rendered in watts.');
    if (example.coolingCapacityBtuH) assert.ok(detailHtml.includes(`${format(example.coolingCapacityBtuH)} BTU/h`), 'Cooling capacity is rendered in BTU/h.');
    if (example.placeSettings) assert.ok(detailHtml.includes(`${example.placeSettings} ${language === 'pt-BR' ? 'serviços' : language === 'en-US' ? 'place settings' : 'servicios'}`), 'Dishwashers show place settings.');
    checked += 2;
  }
  const unknownMeasure = await fetch(`${origin}${prefix}/produtos/philips-walita-hr2270-91`);
  assert.equal(unknownMeasure.status, 200);
  const unknownHtml = await unknownMeasure.text();
  const pending = language === 'pt-BR' ? 'A confirmar' : language === 'en-US' ? 'To be confirmed' : 'Por confirmar';
  assert.ok(unknownHtml.includes(`<td>${pending}</td><td class="pending-text">${pending}</td>`), 'Missing measure must not be marked as documented.');
  checked += 1;
}
const rememberedQuery = `q=${product.model}&brand=${product.brand}&category=washing_machine`;
const remembered = await fetch(`${origin}/produtos?${rememberedQuery}`, { redirect: 'manual', headers: { Cookie: 'duraverso_locale=es' } });
assert.equal(remembered.status, 307);
assert.equal(new URL(remembered.headers.get('location'), origin).href, `${origin}/es/produtos?${rememberedQuery}`);
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
console.log(`Preview smoke passed: ${checked + 2} checks; ${categories.length} appliance categories, ${brands.length} brands, three languages, disabled accounts, API, combined filters, all documented codes and nonce CSP.`);
