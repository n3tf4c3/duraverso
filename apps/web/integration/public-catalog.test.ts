import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { Pool } from 'pg';
import { randomInt, randomUUID } from 'node:crypto';
import { catalogResponseSchema, isValidGtin } from '@duraverso/core';
import { PublicCatalogService } from '@/server/catalog';
import { catalogGet } from '@/server/catalog-http';
import type { Database } from '@/server/database';

const address = new URL(process.env.TEST_DATABASE_URL ?? 'http://invalid');
if (address.hostname !== '127.0.0.1' || !address.port || address.pathname !== '/duraverso_test' || !process.env.TEST_RUN_ID) {
  throw new Error('Execute pelo runner: somente banco descartável marcado.');
}
const pool = new Pool({ connectionString: address.href, max: 2, application_name: 'duraverso-public-catalog-tests' });
beforeAll(async () => {
  expect((await pool.query('SELECT run_id FROM duraverso_test_guard.marker')).rows).toEqual([{ run_id: process.env.TEST_RUN_ID }]);
});
afterAll(async () => { await pool.end(); });
const db: Database = { async query<T extends Record<string, unknown>>(sql: string, values: unknown[] = []) { return (await pool.query<T>(sql, values)).rows; } };
const service = new PublicCatalogService(db);
const get = catalogGet(() => service.read());
const code = () => {
  const prefix = `2${String(randomInt(0, 100_000_000_000)).padStart(11, '0')}`;
  return [...'0123456789'].map((digit) => prefix + digit).find(isValidGtin)!;
};

describe('visibilidade do catálogo persistente', () => {
  it('publica somente modelo verificado e códigos de variantes verificadas; revogação é imediata', async () => {
    const id = randomUUID(); const slug = `public-test-${id}`; const approved = randomUUID(); const pending = randomUUID();
    const approvedCode = code(); const pendingCode = code();
    await pool.query(`INSERT INTO products(id,slug,brand,model,capacity_kg,source_url,source_checked_at)
      VALUES($1,$2,'Consul',$2,9,'https://example.test/model','2026-11-06T00:00:00Z')`, [id, slug]);
    await pool.query(`INSERT INTO variants(id,product_id,manufacturer_code,voltage,verified) VALUES
      ($1,$3,'FIXTURE-127',127,true),($2,$3,'FIXTURE-220',220,false)`, [approved, pending, id]);
    await pool.query(`INSERT INTO gtins(code,variant_id,source_url) VALUES($1,$3,'https://example.test/gtin'),($2,$4,'https://example.test/gtin')`, [approvedCode, pendingCode, approved, pending]);
    const request = async (q: string, extra = '') => {
      const response = await get(new Request(`http://localhost/api/v1/products?q=${encodeURIComponent(q)}${extra}`));
      expect(response.status).toBe(200);
      expect(response.headers.get('Cache-Control')).toBe('no-store');
      return catalogResponseSchema.parse(await response.json());
    };
    expect((await service.read()).data.some((product) => product.slug === slug)).toBe(false);
    expect((await request(approvedCode)).total).toBe(0);
    await pool.query('UPDATE products SET verified=true WHERE id=$1', [id]);
    const result = await request(approvedCode);
    expect(result.mode).toBe('database_catalog');
    expect(result.data).toEqual([{ id: slug, slug, brand: 'Consul', model: slug, capacityKg: 9,
      sourceUrl: 'https://example.test/model', sourceCheckedAt: '2026-11-06', identification: 'verified', confirmedGtins: [approvedCode] }]);
    expect((await request(pendingCode)).total).toBe(0);
    expect((await request(approvedCode, '&brand=Brastemp')).total).toBe(0);
    expect((await request(approvedCode, '&capacity=small')).total).toBe(1);
    expect((await request(approvedCode, '&capacity=large')).total).toBe(0);
    expect((await request(approvedCode.slice(0, -1))).total).toBe(0);
    await pool.query('UPDATE variants SET verified=false WHERE id=$1', [approved]);
    expect((await request(approvedCode)).total).toBe(0);
    expect((await request(slug)).data[0]?.confirmedGtins).toEqual([]);
    await pool.query('UPDATE products SET verified=false WHERE id=$1', [id]);
    expect((await request(slug)).total).toBe(0);
  });
});
