import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { Pool } from 'pg';
import { randomInt, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { isValidGtin, type Product, type CatalogVariantEvidence } from '@duraverso/core';
import { importCatalog } from '@/db/catalog-importer';
import { catalogPlan } from '@/lib/catalog-plan';

const address = new URL(process.env.TEST_DATABASE_URL ?? 'http://invalid');
if (address.hostname !== '127.0.0.1' || !address.port || address.pathname !== '/duraverso_test' || !process.env.TEST_RUN_ID) {
  throw new Error('Execute pelo runner: somente banco descartável marcado.');
}
const pool = new Pool({ connectionString: address.href, max: 4, application_name: 'duraverso-catalog-tests' });
beforeAll(async () => {
  expect((await pool.query('SELECT run_id FROM duraverso_test_guard.marker')).rows).toEqual([{ run_id: process.env.TEST_RUN_ID }]);
});
afterAll(async () => { await pool.end(); });

function fixture(): { products: [Product]; variants: [CatalogVariantEvidence] } {
  const id = randomUUID();
  const prefix = `2${String(randomInt(0, 100_000_000_000)).padStart(11, '0')}`;
  const gtin = [...'0123456789'].map((digit) => prefix + digit).find(isValidGtin)!;
  const product: Product = { id, slug: `fixture-${id}`, brand: 'Consul', model: id, capacityKg: 9,
    sourceUrl: 'https://example.test/model', sourceCheckedAt: '2026-11-06', identification: 'candidate', confirmedGtins: [gtin] };
  const variant: CatalogVariantEvidence = { productSlug: product.slug, gtin, manufacturerCode: id,
    codeKind: 'catalog_reference', voltage: 127, sourceUrl: 'https://example.test/gtin',
    voltageSourceUrl: 'https://example.test/voltage', checkedAt: '2026-11-06', note: 'Evidência sintética apenas no banco descartável.' };
  return { products: [product], variants: [variant] };
}
async function run(plan: { products: unknown; variants: unknown }, apply = false) {
  const client = await pool.connect();
  try { return await importCatalog(client, plan.products, plan.variants, apply); }
  finally { client.release(); }
}
async function counts() {
  return (await pool.query(`SELECT (SELECT count(*)::int FROM products) AS products,
    (SELECT count(*)::int FROM variants) AS variants,(SELECT count(*)::int FROM gtins) AS gtins,
    (SELECT count(*)::int FROM catalog_variant_evidence) AS evidence`)).rows[0];
}

describe.sequential('importação persistente do catálogo', () => {
  it('confere sem escrever e importa os 20 modelos/40 variantes com evidências e sem ativação', async () => {
    const plan = catalogPlan();
    const before = await counts();
    const expected = { products: 20, variants: 40, gtins: 40, evidence: 40 };
    expect(await run(plan)).toMatchObject({ mode: 'dry_run', applied: false, insertions: expected, conflicts: [] });
    expect(await counts()).toEqual(before);
    expect(await run(plan, true)).toMatchObject({ applied: true, insertions: expected, conflicts: [] });
    const persisted = (await pool.query(`SELECT p.slug,p.verified AS product_verified,v.verified AS variant_verified,
      v.manufacturer_code,v.code_kind,v.voltage,g.code,g.source_url,e.voltage_source_url,
      to_char(e.checked_at AT TIME ZONE 'UTC','YYYY-MM-DD') AS checked_at,e.note
      FROM products p JOIN variants v ON v.product_id=p.id JOIN gtins g ON g.variant_id=v.id
      JOIN catalog_variant_evidence e ON e.gtin_code=g.code WHERE p.slug=ANY($1)`, [plan.products.map((product) => product.slug)])).rows;
    expect(persisted).toHaveLength(40);
    for (const variant of plan.variants) {
      expect(persisted.find((row) => row.code === variant.gtin)).toEqual({ slug: variant.productSlug,
        product_verified: false, variant_verified: false, manufacturer_code: variant.manufacturerCode,
        code_kind: variant.codeKind, voltage: variant.voltage, code: variant.gtin, source_url: variant.sourceUrl,
        voltage_source_url: variant.voltageSourceUrl, checked_at: variant.checkedAt, note: variant.note });
    }
    const idsBefore = (await pool.query('SELECT id FROM variants ORDER BY id')).rows;
    expect(await run(plan, true)).toMatchObject({ applied: true, insertions: { products: 0, variants: 0, gtins: 0, evidence: 0 } });
    expect((await pool.query('SELECT id FROM variants ORDER BY id')).rows).toEqual(idsBefore);
  });
  it('preserva os estados verificados de registros existentes', async () => {
    const plan = fixture();
    await run(plan, true);
    await pool.query('UPDATE products SET verified=true WHERE slug=$1', [plan.products[0].slug]);
    await pool.query('UPDATE variants SET verified=true WHERE manufacturer_code=$1', [plan.variants[0].manufacturerCode]);
    await run(plan, true);
    expect((await pool.query(`SELECT p.verified AS p,v.verified AS v FROM products p JOIN variants v ON v.product_id=p.id
      WHERE p.slug=$1`, [plan.products[0].slug])).rows).toEqual([{ p: true, v: true }]);
  });
  it('importa categoria e litros apenas com evidência completa, preservando medidas existentes', async () => {
    const plan = fixture();
    plan.products[0] = { ...plan.products[0], category: 'refrigerator', capacityKg: undefined, capacityLiters: 300 };
    expect((await run(plan, true)).applied).toBe(true);
    const persisted = (await pool.query('SELECT category,capacity_kg,capacity_liters::float AS liters,burner_count FROM products WHERE slug=$1',
      [plan.products[0].slug])).rows[0];
    expect(persisted).toEqual({ category: 'refrigerator', capacity_kg: null, liters: 300, burner_count: null });
    expect(await run(plan, true)).toMatchObject({ applied: true, insertions: { products: 0, variants: 0, gtins: 0, evidence: 0 } });
    for (const change of [{ capacityLiters: 310 }, { category: 'microwave' as const }]) {
      expect(await run({ ...plan, products: [{ ...plan.products[0], ...change }] }, true)).toMatchObject({ applied: false,
        conflicts: [{ entity: 'product', key: plan.products[0].slug }] });
    }
    expect((await pool.query('SELECT capacity_liters::float AS liters FROM products WHERE slug=$1', [plan.products[0].slug])).rows[0].liters).toBe(300);
  });
  it.each([
    ['coffee_maker', 'Philips Walita', 'capacityLiters', 1.25],
    ['dishwasher', 'Midea', 'placeSettings', 14],
    ['vacuum_cleaner', 'WAP', 'powerWatts', 1500],
  ] as const)('importa %s com precisão e não sobrescreve a medida existente', async (category, brand, field, amount) => {
    const plan = fixture();
    plan.products[0] = { ...plan.products[0], brand, category, capacityKg: undefined, [field]: amount };
    expect((await run(plan, true)).applied).toBe(true);
    expect(await run(plan, true)).toMatchObject({ applied: true, insertions: { products: 0, variants: 0, gtins: 0, evidence: 0 } });
    const row = (await pool.query(`SELECT category,brand,capacity_kg,capacity_liters::float AS "capacityLiters",
      place_settings AS "placeSettings",power_watts::float AS "powerWatts" FROM products WHERE slug=$1`, [plan.products[0].slug])).rows[0];
    expect(row).toMatchObject({ category, brand, capacity_kg: null, [field]: amount });
    expect(await run({ ...plan, products: [{ ...plan.products[0], [field]: amount + 1 }] }, true)).toMatchObject({ applied: false,
      conflicts: [{ entity: 'product', key: plan.products[0].slug }] });
  });
  it('executa o comando administrativo e recusa confirmação de outro destino', async () => {
    const require = createRequire(import.meta.url);
    const cli = (args: string[]) => spawnSync(process.execPath, [require.resolve('tsx/cli'), 'src/db/catalog-import.ts', ...args], {
      encoding: 'utf8', windowsHide: true, timeout: 20000,
      env: { ...process.env, DATABASE_URL_DIRECT: address.href, VERCEL: '' },
    });
    const before = await counts();
    const check = cli([]);
    expect(check.status).toBe(0);
    expect(JSON.parse(check.stdout)).toMatchObject({ mode: 'dry_run', applied: false, conflicts: [] });
    const target = `${address.hostname}:${address.port}${address.pathname}`;
    const apply = cli(['--apply', `--expect-target=${target}`]);
    expect(apply.status).toBe(0);
    expect(JSON.parse(apply.stdout)).toMatchObject({ mode: 'apply', applied: true, insertions: { products: 0, variants: 0, gtins: 0, evidence: 0 } });
    const wrong = cli(['--apply', '--expect-target=127.0.0.1:1/other']);
    expect(wrong.status).toBe(1);
    expect(wrong.stdout).toBe('');
    expect(wrong.stderr).not.toContain('test-only');
    expect(await counts()).toEqual(before);
  });
  it('recusa alteração de identidade, tensão, GTIN e evidência sem alterar o banco', async () => {
    const plan = fixture();
    await run(plan, true);
    const before = await counts();
    for (const changed of [
      { ...plan, products: [{ ...plan.products[0], capacityKg: 12 }] },
      { ...plan, variants: [{ ...plan.variants[0], voltage: 220 }] },
      { ...plan, variants: [{ ...plan.variants[0], manufacturerCode: 'outro' }] },
      { ...plan, variants: [{ ...plan.variants[0], codeKind: 'manufacturer_reference' }] },
      { ...plan, variants: [{ ...plan.variants[0], sourceUrl: 'https://example.test/other' }] },
      { ...plan, variants: [{ ...plan.variants[0], note: 'Evidência divergente.' }] },
    ]) {
      const result = await run(changed, true);
      expect(result.applied).toBe(false);
      expect(result.conflicts.length).toBeGreaterThan(0);
      expect(await counts()).toEqual(before);
    }
    expect((await pool.query('SELECT voltage,code_kind FROM variants WHERE manufacturer_code=$1', [plan.variants[0].manufacturerCode])).rows)
      .toEqual([{ voltage: 127, code_kind: 'catalog_reference' }]);
  });
  it('não reassocia GTIN já pertencente a outro modelo e não insere parte do lote', async () => {
    const existing = fixture();
    await run(existing, true);
    const other = fixture();
    other.products[0].confirmedGtins = existing.products[0].confirmedGtins;
    other.variants[0].gtin = existing.variants[0].gtin;
    const extra = fixture();
    const before = await counts();
    const result = await run({ products: [...extra.products, ...other.products], variants: [...extra.variants, ...other.variants] }, true);
    expect(result.conflicts).toContainEqual({ entity: 'gtin', key: existing.variants[0].gtin });
    expect(result.applied).toBe(false);
    expect(await counts()).toEqual(before);
  });
  it('registros legados continuam válidos mas identificador sem tipo exige revisão', async () => {
    const plan = fixture();
    const p = plan.products[0];
    const result = await pool.query(`INSERT INTO products(slug,brand,model,capacity_kg,source_url,source_checked_at)
      VALUES($1,$2,$3,$4,$5,$6) RETURNING id`, [p.slug, p.brand, p.model, p.capacityKg, p.sourceUrl, `${p.sourceCheckedAt}T00:00:00Z`]);
    await pool.query('INSERT INTO variants(product_id,manufacturer_code,voltage) VALUES($1,$2,127)', [result.rows[0].id, plan.variants[0].manufacturerCode]);
    expect(await run(plan, true)).toMatchObject({ applied: false, conflicts: [{ entity: 'variant', key: plan.variants[0].gtin }] });
    expect((await pool.query('SELECT code_kind FROM variants WHERE product_id=$1', [result.rows[0].id])).rows).toEqual([{ code_kind: null }]);
  });
  it('reverte todas as inserções se a última etapa falha no PostgreSQL', async () => {
    const plan = fixture();
    const before = await counts();
    // Trigger de falha somente no banco descartável validado pelo marker do runner.
    await pool.query(`CREATE FUNCTION duraverso_test_guard.reject_catalog_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN RAISE EXCEPTION 'falha sintética'; END $$;
      CREATE TRIGGER test_reject_catalog_evidence BEFORE INSERT ON catalog_variant_evidence
      FOR EACH ROW EXECUTE FUNCTION duraverso_test_guard.reject_catalog_evidence()`);
    try { await expect(run(plan, true)).rejects.toThrow('falha sintética'); }
    finally {
      await pool.query('DROP TRIGGER test_reject_catalog_evidence ON catalog_variant_evidence; DROP FUNCTION duraverso_test_guard.reject_catalog_evidence()');
    }
    expect(await counts()).toEqual(before);
    expect((await run(plan, true)).applied).toBe(true);
  });
  it('duas importações simultâneas inserem apenas um conjunto de registros', async () => {
    const plan = fixture();
    const results = await Promise.all([run(plan, true), run(plan, true)]);
    expect(results.every((result) => result.applied && !result.conflicts.length)).toBe(true);
    expect(results.map((result) => result.insertions.products).sort()).toEqual([0, 1]);
    expect(results.map((result) => result.insertions.variants).sort()).toEqual([0, 1]);
    expect((await pool.query('SELECT code FROM gtins WHERE code=$1', [plan.variants[0].gtin])).rows).toHaveLength(1);
  });
});
