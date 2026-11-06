import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { Pool } from 'pg';
import { randomUUID } from 'node:crypto';
import { connectedSchemaReadinessSql } from '@/server/preflight';

const address = new URL(process.env.TEST_DATABASE_URL ?? 'http://invalid');
if (address.hostname !== '127.0.0.1' || !address.port || address.pathname !== '/duraverso_test' || !process.env.TEST_RUN_ID) {
  throw new Error('Execute pelo runner: somente banco descartável marcado.');
}
const pool = new Pool({ connectionString: address.href, max: 2, application_name: 'duraverso-category-constraints-tests' });
beforeAll(async () => {
  expect((await pool.query('SELECT run_id FROM duraverso_test_guard.marker')).rows).toEqual([{ run_id: process.env.TEST_RUN_ID }]);
});
afterAll(async () => { await pool.end(); });

describe('schema de categorias no PostgreSQL descartável', () => {
  it('mantém INSERT legado e recusa medidas incompatíveis diretamente no banco', async () => {
    const slug = `legacy-${randomUUID()}`;
    expect((await pool.query(`INSERT INTO products(slug,brand,model,capacity_kg,source_url,source_checked_at)
      VALUES($1,'Consul',$1,9,'https://example.test/model','2026-11-06') RETURNING category`, [slug])).rows[0].category).toBe('washing_machine');
    for (const [category, kg, liters, burners] of [
      ['washing_machine', null, null, null], ['washing_machine', 9, 100, null],
      ['refrigerator', 9, 300, null], ['microwave', null, 32, 4], ['stove', null, 80, 4],
      ['refrigerator', null, -1, null], ['stove', null, null, 0], ['unknown', null, null, null],
    ]) {
      const invalidSlug = `invalid-${randomUUID()}`;
      await expect(pool.query(`INSERT INTO products(slug,brand,model,category,capacity_kg,capacity_liters,burner_count,source_url,source_checked_at)
        VALUES($1,'Consul',$1,$2,$3,$4,$5,'https://example.test/model','2026-11-06')`,
      [invalidSlug, category, kg, liters, burners])).rejects.toMatchObject({ code: '23514' });
    }
  });
  it('preflight recusa migração ausente ou constraint removida e aceita schema completo', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      expect((await client.query(connectedSchemaReadinessSql)).rows[0].ready).toBe(true);
      await client.query('SAVEPOINT complete_schema');
      await client.query('DROP FUNCTION duraverso_catalog_categories_version()');
      expect((await client.query(connectedSchemaReadinessSql)).rows[0].ready).toBe(false);
      await client.query('ROLLBACK TO SAVEPOINT complete_schema');
      await client.query('ALTER TABLE products DROP CONSTRAINT product_category_measures');
      expect((await client.query(connectedSchemaReadinessSql)).rows[0].ready).toBe(false);
    } finally { await client.query('ROLLBACK'); client.release(); }
  });
});
