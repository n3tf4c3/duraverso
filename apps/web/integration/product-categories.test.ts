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
      await client.query('CREATE OR REPLACE FUNCTION duraverso_catalog_categories_version() RETURNS integer LANGUAGE sql IMMUTABLE AS $$ SELECT 4 $$');
      expect((await client.query(connectedSchemaReadinessSql)).rows[0].ready).toBe(false);
      await client.query('ROLLBACK TO SAVEPOINT complete_schema');
      await client.query('DROP FUNCTION duraverso_catalog_categories_version()');
      await expect(client.query(connectedSchemaReadinessSql)).rejects.toMatchObject({ code: '42883' });
      await client.query('ROLLBACK TO SAVEPOINT complete_schema');
      await client.query('ALTER TABLE products DROP CONSTRAINT product_category_measures');
      expect((await client.query(connectedSchemaReadinessSql)).rows[0].ready).toBe(false);
    } finally { await client.query('ROLLBACK'); client.release(); }
  });
  it('aceita medidas novas, preserva litros fracionários e recusa unidades incompatíveis no PostgreSQL', async () => {
    for (const [category, liters, burners, settings, watts] of [
      ['coffee_maker', 1.25, null, null, null], ['air_fryer', 4.1, null, null, null],
      ['blender', 2.1, null, null, null], ['freezer', 200, null, null, null],
      ['oven', 80, null, null, null], ['cooktop', null, 5, null, null],
      ['dishwasher', null, null, 14, null], ['vacuum_cleaner', null, null, null, 1500],
    ] as const) {
      const slug = `expanded-${randomUUID()}`;
      const result = await pool.query(`INSERT INTO products(slug,brand,model,category,capacity_liters,burner_count,place_settings,power_watts,source_url,source_checked_at)
        VALUES($1,'Electrolux',$1,$2,$3,$4,$5,$6,'https://example.test/model','2026-11-06')
        RETURNING capacity_liters::float AS liters,burner_count AS burners,place_settings AS settings,power_watts::float AS watts`,
      [slug, category, liters, burners, settings, watts]);
      expect(result.rows[0]).toEqual({ liters, burners, settings, watts });
    }
    for (const [category, liters, burners, settings, watts] of [
      ['coffee_maker', 1.25, null, null, 900], ['dishwasher', 14, null, 14, null],
      ['vacuum_cleaner', null, null, 14, 1500], ['cooktop', null, 4, null, 1500],
      ['dishwasher', null, null, 0, null], ['vacuum_cleaner', null, null, null, -1],
    ]) {
      const slug = `invalid-expanded-${randomUUID()}`;
      await expect(pool.query(`INSERT INTO products(slug,brand,model,category,capacity_liters,burner_count,place_settings,power_watts,source_url,source_checked_at)
        VALUES($1,'Electrolux',$1,$2,$3,$4,$5,$6,'https://example.test/model','2026-11-06')`,
      [slug, category, liters, burners, settings, watts])).rejects.toMatchObject({ code: '23514' });
    }
  });
  it('preserva BTU/h nominal e rejeita potência elétrica, unidades incompatíveis e valores inválidos', async () => {
    const slug = `air-${randomUUID()}`;
    const result = await pool.query(`INSERT INTO products(slug,brand,model,category,cooling_capacity_btu_h,source_url,source_checked_at)
      VALUES($1,'LG',$1,'air_conditioner',1000000,'https://example.test/model','2026-11-06')
      RETURNING cooling_capacity_btu_h::float AS cooling,capacity_kg,power_watts`, [slug]);
    expect(result.rows[0]).toEqual({ cooling: 1000000, capacity_kg: null, power_watts: null });
    for (const [category, cooling, watts] of [
      ['air_conditioner', 0, null], ['air_conditioner', -12000, null], ['air_conditioner', 'NaN', null],
      ['air_conditioner', 12000, 1200], ['vacuum_cleaner', 12000, 1200], ['refrigerator', 12000, null],
    ]) {
      const invalid = `air-invalid-${randomUUID()}`;
      await expect(pool.query(`INSERT INTO products(slug,brand,model,category,cooling_capacity_btu_h,power_watts,source_url,source_checked_at)
        VALUES($1,'LG',$1,$2,$3,$4,'https://example.test/model','2026-11-06')`,
      [invalid, category, cooling, watts])).rejects.toMatchObject({ code: '23514' });
    }
  });
});
