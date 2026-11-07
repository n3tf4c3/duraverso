import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { Pool } from 'pg';
import { randomInt, randomUUID } from 'node:crypto';
import { catalogActivationIssues, isValidGtin, type Actor } from '@duraverso/core';
import { CatalogAdminService } from '@/server/catalog-admin';
import { PublicCatalogService } from '@/server/catalog';
import { ReviewService } from '@/server/reviews';
import { mutation } from '@/server/http';
import type { Database } from '@/server/database';

const address = new URL(process.env.TEST_DATABASE_URL ?? 'http://invalid');
if (
  address.hostname !== '127.0.0.1' ||
  !address.port ||
  address.pathname !== '/duraverso_test' ||
  !process.env.TEST_RUN_ID
) {
  throw new Error('Execute pelo runner: somente banco descartável marcado.');
}
const pool = new Pool({ connectionString: address.href, max: 4, application_name: 'duraverso-catalog-admin-tests' });
beforeAll(async () => {
  expect((await pool.query('SELECT run_id FROM duraverso_test_guard.marker')).rows).toEqual([
    { run_id: process.env.TEST_RUN_ID },
  ]);
});
afterAll(async () => {
  await pool.end();
});
const db: Database = {
  async query<T extends Record<string, unknown>>(sql: string, values: unknown[] = []) {
    return (await pool.query<T>(sql, values)).rows;
  },
};
const service = new CatalogAdminService(db);
const publicCatalog = new PublicCatalogService(db);
async function fixture(role: Actor['role'] = 'admin') {
  const actor: Actor = { id: randomUUID(), role, sessionVersion: 0, displayName: 'Equipe de teste' };
  const productId = randomUUID();
  const variantId = randomUUID();
  const slug = `admin-${productId}`;
  const prefix = `2${String(randomInt(0, 100_000_000_000)).padStart(11, '0')}`;
  const code = [...'0123456789'].map((digit) => prefix + digit).find(isValidGtin)!;
  await pool.query('INSERT INTO users(id,google_subject,display_name,role) VALUES($1::uuid,$1::text,$2,$3)', [
    actor.id,
    actor.displayName,
    role,
  ]);
  await pool.query(
    `INSERT INTO products(id,slug,brand,model,capacity_kg,source_url,source_checked_at)
    VALUES($1,$2,'Consul',$2,9,'https://example.test/model','2026-01-01')`,
    [productId, slug],
  );
  await pool.query(
    `INSERT INTO variants(id,product_id,manufacturer_code,voltage,code_kind)
    VALUES($1,$2,'REFERENCE-127',127,'catalog_reference')`,
    [variantId, productId],
  );
  await pool.query(`INSERT INTO gtins(code,variant_id,source_url) VALUES($1,$2,'https://example.test/code')`, [
    code,
    variantId,
  ]);
  await pool.query(
    `INSERT INTO catalog_variant_evidence(gtin_code,voltage_source_url,checked_at,note)
    VALUES($1,'https://example.test/voltage','2026-01-01','Referência documental de teste, sem revisão física inferida.')`,
    [code],
  );
  const read = async () => (await service.read(actor)).find((entry) => entry.product.id === productId)!;
  const input = async (target: string | null = null, verified = true) => ({
    productId,
    variantId: target,
    verified,
    expectedToken: (await read()).token,
    reason: 'Fontes conferidas no teste descartável.',
    evidenceConfirmed: true,
  });
  return { actor, productId, variantId, code, slug, read, input };
}

describe('administração auditável do catálogo', () => {
  it('libera modelo e variante separadamente; suspensão retira disponibilidade e conserva histórico', async () => {
    const f = await fixture();
    const visible = async () => (await publicCatalog.read()).data.find((p) => p.slug === f.slug);
    expect(await visible()).toBeUndefined();
    expect(catalogActivationIssues((await f.read()).product, f.variantId)).toContain(
      'Libere o modelo antes de liberar a variante.',
    );
    await expect(service.decide(f.actor, await f.input(f.variantId))).rejects.toMatchObject({ status: 422 });
    await service.decide(f.actor, await f.input());
    expect((await visible())?.confirmedGtins).toEqual([]);
    await service.decide(f.actor, await f.input(f.variantId));
    expect((await visible())?.confirmedGtins).toEqual([f.code]);
    expect(await new ReviewService(db).variants(f.slug)).toHaveLength(1);
    await service.decide(f.actor, await f.input(null, false));
    expect(await visible()).toBeUndefined();
    expect(await new ReviewService(db).variants(f.slug)).toHaveLength(0);
    await service.decide(f.actor, await f.input());
    expect((await visible())?.confirmedGtins).toEqual([f.code]);
    await service.decide(f.actor, await f.input(f.variantId, false));
    expect((await visible())?.confirmedGtins).toEqual([]);
    const entry = await f.read();
    expect(entry.history).toHaveLength(5);
    expect(entry.product.revision).toBe(5);
    expect(
      entry.history.every(
        (d) => d.administratorId === f.actor.id && d.reason.length > 0 && Number.isFinite(Date.parse(d.createdAt)),
      ),
    ).toBe(true);
    const audit = (
      await pool.query('SELECT snapshot FROM catalog_decisions WHERE product_id=$1 ORDER BY created_at,id', [
        f.productId,
      ])
    ).rows;
    expect(audit[0].snapshot.verified).toBe(false);
    expect(audit[0].snapshot.variants[0].gtins[0].note).toContain('sem revisão física');
  });
  it.each(['member', 'moderator'] as const)('recusa %s mesmo com papel admin alegado pelo chamador', async (role) => {
    const f = await fixture(role);
    const actor = { ...f.actor, role: 'admin' as const };
    await expect(service.read(actor)).rejects.toMatchObject({ status: 403 });
    await expect(
      service.decide(actor, {
        productId: f.productId,
        variantId: null,
        verified: false,
        expectedToken: '0'.repeat(32),
        reason: 'Tentativa',
        evidenceConfirmed: false,
      }),
    ).rejects.toMatchObject({ status: 403 });
    expect(
      (await pool.query('SELECT count(*)::int AS count FROM catalog_decisions WHERE product_id=$1', [f.productId]))
        .rows[0].count,
    ).toBe(0);
  });
  it('revalida sessão, desativação de conta e papel do banco na leitura e na escrita', async () => {
    const f = await fixture();
    const input = await f.input();
    for (const [sql, status] of [
      ['UPDATE users SET session_version=1 WHERE id=$1', 401],
      ['UPDATE users SET session_version=0,disabled_at=now() WHERE id=$1', 401],
      ["UPDATE users SET disabled_at=NULL,role='member' WHERE id=$1", 403],
    ] as const) {
      await pool.query(sql, [f.actor.id]);
      await expect(service.read(f.actor)).rejects.toMatchObject({ status });
      await expect(service.decide(f.actor, { ...input, verified: false })).rejects.toMatchObject({ status });
    }
  });
  it('recusa tela antiga após mudança de evidência e após ciclo libera/suspende', async () => {
    const f = await fixture();
    const old = await f.input();
    await pool.query("UPDATE catalog_variant_evidence SET note='Evidência revisada.' WHERE gtin_code=$1", [f.code]);
    await expect(service.decide(f.actor, old)).rejects.toMatchObject({ status: 409 });
    const beforeCycle = await f.input();
    await service.decide(f.actor, beforeCycle);
    await service.decide(f.actor, await f.input(null, false));
    await expect(service.decide(f.actor, beforeCycle)).rejects.toMatchObject({ status: 409 });
  });
  it('serializa duas decisões concorrentes e registra somente a vencedora', async () => {
    const f = await fixture();
    const input = await f.input();
    const results = await Promise.allSettled([service.decide(f.actor, input), service.decide(f.actor, input)]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.find((r) => r.status === 'rejected')).toMatchObject({ reason: { status: 409 } });
    expect((await f.read()).history).toHaveLength(1);
  });
  it.each([
    'LG',
    'Samsung',
    'Gree',
    'Daikin',
    'Fujitsu',
    'Carrier',
    'Springer Midea',
    'Elgin',
    'TCL',
    'Hisense',
    'Philco',
    'Agratto',
  ] as const)('audita BTU/h de %s e recusa decisão desatualizada', async (brand) => {
    const f = await fixture();
    await pool.query(
      `UPDATE products SET category='air_conditioner',brand=$2,capacity_kg=NULL,cooling_capacity_btu_h=12000 WHERE id=$1`,
      [f.productId, brand],
    );
    const old = await f.input();
    await pool.query('UPDATE products SET cooling_capacity_btu_h=18000 WHERE id=$1', [f.productId]);
    await expect(service.decide(f.actor, old)).rejects.toMatchObject({ status: 409 });
    await service.decide(f.actor, await f.input());
    const audit = (await pool.query('SELECT snapshot FROM catalog_decisions WHERE product_id=$1', [f.productId]))
      .rows[0].snapshot;
    const visible = (await publicCatalog.read()).data.find((product) => product.slug === f.slug);
    for (const data of [audit, visible]) {
      expect(data).toMatchObject({ category: 'air_conditioner', brand, coolingCapacityBtuH: 18000 });
      expect(data).not.toHaveProperty('capacityKg');
      expect(data).not.toHaveProperty('powerWatts');
    }
  });
  it('inclui categoria e medidas no token e no histórico auditável', async () => {
    const f = await fixture();
    await pool.query("UPDATE products SET category='refrigerator',capacity_kg=NULL,capacity_liters=300 WHERE id=$1", [
      f.productId,
    ]);
    const oldMeasure = await f.input();
    expect((await f.read()).product).toMatchObject({ category: 'refrigerator', capacityLiters: 300 });
    expect((await f.read()).product).not.toHaveProperty('capacityKg');
    await pool.query('UPDATE products SET capacity_liters=310 WHERE id=$1', [f.productId]);
    await expect(service.decide(f.actor, oldMeasure)).rejects.toMatchObject({ status: 409 });
    const oldCategory = await f.input();
    await pool.query("UPDATE products SET category='microwave' WHERE id=$1", [f.productId]);
    await expect(service.decide(f.actor, oldCategory)).rejects.toMatchObject({ status: 409 });
    await service.decide(f.actor, await f.input());
    const audit = (await pool.query('SELECT snapshot FROM catalog_decisions WHERE product_id=$1', [f.productId]))
      .rows[0].snapshot;
    expect(audit).toMatchObject({ category: 'microwave', capacityLiters: 310, verified: false });
    expect(audit).not.toHaveProperty('capacityKg');
    const visible = (await publicCatalog.read()).data.find((product) => product.slug === f.slug);
    expect(visible).toMatchObject({ category: 'microwave', capacityLiters: 310 });
  });
  it.each([
    ['dishwasher', 'Midea', 14, null, 15, null],
    ['vacuum_cleaner', 'WAP', null, 1500, null, 1600],
  ] as const)(
    'audita novas medidas de %s e invalida decisões antigas',
    async (category, brand, settings, watts, nextSettings, nextWatts) => {
      const f = await fixture();
      await pool.query(
        `UPDATE products SET category=$2,brand=$3,capacity_kg=NULL,place_settings=$4,power_watts=$5 WHERE id=$1`,
        [f.productId, category, brand, settings, watts],
      );
      const old = await f.input();
      await pool.query('UPDATE products SET place_settings=$2,power_watts=$3 WHERE id=$1', [
        f.productId,
        nextSettings,
        nextWatts,
      ]);
      await expect(service.decide(f.actor, old)).rejects.toMatchObject({ status: 409 });
      await service.decide(f.actor, await f.input());
      const audit = (await pool.query('SELECT snapshot FROM catalog_decisions WHERE product_id=$1', [f.productId]))
        .rows[0].snapshot;
      const visible = (await publicCatalog.read()).data.find((product) => product.slug === f.slug);
      for (const data of [audit, visible]) {
        expect(data).toMatchObject({ category, brand });
        expect(data).not.toHaveProperty('capacityKg');
        expect(data).not.toHaveProperty('capacityLiters');
        if (nextSettings) expect(data).toHaveProperty('placeSettings', nextSettings);
        if (nextWatts) expect(data).toHaveProperty('powerWatts', nextWatts);
      }
    },
  );
  it('SQL recusa evidência incompleta, checksum inválido e data futura mesmo sem a validação web', async () => {
    const f = await fixture();
    await service.decide(f.actor, await f.input());
    const direct = async () =>
      db.query('SELECT duraverso_decide_catalog($1,$2,$3)', [
        f.actor.id,
        0,
        JSON.stringify(await f.input(f.variantId)),
      ]);
    await pool.query('DELETE FROM catalog_variant_evidence WHERE gtin_code=$1', [f.code]);
    await expect(direct()).rejects.toThrow('catalog_evidence_required');
    await pool.query(
      `INSERT INTO catalog_variant_evidence(gtin_code,voltage_source_url,checked_at,note)
      VALUES($1,'https://example.test/voltage','2999-01-01','Fonte de teste')`,
      [f.code],
    );
    await expect(direct()).rejects.toThrow('catalog_evidence_required');
    await pool.query("UPDATE catalog_variant_evidence SET checked_at='2026-01-01' WHERE gtin_code=$1", [f.code]);
    const badCode = f.code.slice(0, -1) + ((Number(f.code.at(-1)) + 1) % 10);
    await pool.query("INSERT INTO gtins(code,variant_id,source_url) VALUES($1,$2,'https://example.test/code')", [
      badCode,
      f.variantId,
    ]);
    await pool.query(
      `INSERT INTO catalog_variant_evidence(gtin_code,voltage_source_url,checked_at,note)
      VALUES($1,'https://example.test/voltage','2026-01-01','Checksum inválido de teste')`,
      [badCode],
    );
    await expect(direct()).rejects.toThrow('catalog_evidence_required');
    const entry = await f.read();
    expect(catalogActivationIssues(entry.product, f.variantId)).not.toEqual([]);
    expect(entry.product.variants[0]!.verified).toBe(false);
    expect(entry.history).toHaveLength(1);
  });
  it('permite suspender apesar de evidência inválida e exige nova conferência para reativar', async () => {
    const f = await fixture();
    await service.decide(f.actor, await f.input());
    await service.decide(f.actor, await f.input(f.variantId));
    await pool.query('UPDATE variants SET code_kind=NULL WHERE id=$1', [f.variantId]);
    await service.decide(f.actor, await f.input(null, false));
    await expect(service.decide(f.actor, await f.input())).rejects.toMatchObject({ status: 422 });
    await expect(
      db.query('SELECT duraverso_decide_catalog($1,$2,$3)', [f.actor.id, 0, JSON.stringify(await f.input())]),
    ).rejects.toThrow('catalog_evidence_required');
    await service.decide(f.actor, await f.input(f.variantId, false));
  });
  it('não altera disponibilidade se a gravação do histórico falhar', async () => {
    const f = await fixture();
    const input = await f.input();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // A constraint de teste só alcança esta fixture descartável e desaparece no rollback.
      await client.query(
        `ALTER TABLE catalog_decisions ADD CONSTRAINT test_audit_failure CHECK(product_id <> '${f.productId}'::uuid)`,
      );
      await client.query('SAVEPOINT attempt');
      await expect(
        client.query('SELECT duraverso_decide_catalog($1,$2,$3)', [f.actor.id, 0, JSON.stringify(input)]),
      ).rejects.toThrow('test_audit_failure');
      await client.query('ROLLBACK TO SAVEPOINT attempt');
      expect(
        (await client.query('SELECT verified,catalog_revision FROM products WHERE id=$1', [f.productId])).rows[0],
      ).toEqual({ verified: false, catalog_revision: 0 });
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  });
  it('integra proteção de Origin, prévia, sessão e limitador à decisão administrativa', async () => {
    const f = await fixture();
    const input = await f.input();
    const origin = 'https://duraverso.example';
    const request = (source = origin) =>
      new Request(`${origin}/api/v1/admin/catalog`, {
        method: 'POST',
        headers: { Origin: source, 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
    const dependencies = {
      enabled: () => true,
      origin: () => origin,
      actor: async () => f.actor,
      limit: async () => {},
    };
    const operation = (actor: Actor, body: unknown) => service.decide(actor, body);
    expect((await mutation({ ...dependencies, enabled: () => false }, operation)(request())).status).toBe(503);
    expect((await mutation(dependencies, operation)(request('https://evil.example'))).status).toBe(403);
    expect((await mutation({ ...dependencies, actor: async () => null }, operation)(request())).status).toBe(401);
    expect(
      (
        await mutation(
          {
            ...dependencies,
            limit: async () => {
              throw new Error('limit failed');
            },
          },
          operation,
        )(request())
      ).status,
    ).toBe(503);
    expect((await f.read()).history).toHaveLength(0);
    const response = await mutation(dependencies, operation)(request());
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect((await f.read()).history).toHaveLength(1);
  });
});
