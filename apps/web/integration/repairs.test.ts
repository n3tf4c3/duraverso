import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { Pool } from 'pg';
import { randomUUID } from 'node:crypto';
import { ReviewService } from '@/server/reviews';
import { RepairService } from '@/server/repairs';
import { accountForGoogle } from '@/server/accounts';
import type { Database } from '@/server/database';
import type { RepairInput, ReviewInput } from '@duraverso/core';

const address = new URL(process.env.TEST_DATABASE_URL ?? 'http://invalid');
if (
  address.hostname !== '127.0.0.1' ||
  !address.port ||
  address.pathname !== '/duraverso_test' ||
  !process.env.TEST_RUN_ID
)
  throw new Error('Execute pelo runner: somente banco descartável marcado.');
const pool = new Pool({ connectionString: address.href, max: 5, application_name: 'duraverso-tests' });
const db: Database = {
  async query<T extends Record<string, unknown>>(text: string, values: unknown[] = []) {
    return (await pool.query<T>(text, values)).rows;
  },
};
const reviews = new ReviewService(db);
const repairs = new RepairService(db);
beforeAll(async () => {
  const marker = await pool.query('SELECT run_id FROM duraverso_test_guard.marker');
  expect(marker.rows).toEqual([{ run_id: process.env.TEST_RUN_ID }]);
});
afterAll(async () => {
  await pool.end();
});

const newAccount = () => accountForGoogle(db, { sub: `test-${randomUUID()}`, email_verified: true });
/** Produto e variante verificados, dono com relato publicado e moderador distinto. */
async function fixture() {
  const owner = await newAccount();
  const moderator = await newAccount();
  await pool.query("UPDATE users SET role='moderator' WHERE id=$1", [moderator.id]);
  moderator.role = 'moderator';
  const productId = randomUUID();
  const variantId = randomUUID();
  const slug = `test-${productId}`;
  await pool.query(
    "INSERT INTO products(id,slug,brand,model,capacity_kg,source_url,source_checked_at,verified) VALUES($1,$2,'Consul',$2,12,'https://example.org',now(),true)",
    [productId, slug],
  );
  await pool.query('INSERT INTO variants(id,product_id,manufacturer_code,voltage,verified) VALUES($1,$2,$3,127,true)', [
    variantId,
    productId,
    slug,
  ]);
  const review: ReviewInput = {
    variantId,
    rating: 3,
    startedUsing: '2020-01',
    acquired: 'new',
    functioning: 'working',
    hadRepair: true,
    buyAgain: 'unsure',
    comment: 'Relato sintético restrito ao banco descartável.',
  };
  const sent = await reviews.submit(owner, { submissionId: randomUUID(), review });
  await reviews.moderate(moderator, { revisionId: sent.id, decision: 'published', reason: 'Teste.' });
  const reviewId = (await reviews.mine(owner))[0]!.id;
  const repair: RepairInput = {
    reviewId,
    occurredMonth: '2024-05',
    symptom: 'Parou de centrifugar.',
    repaired: true,
    resultingStatus: 'working',
    costCents: 35000,
    comment: 'Troca da placa, dado sintético.',
  };
  return { owner, moderator, slug, variantId, reviewId, repair };
}
const submit = (actor: Awaited<ReturnType<typeof newAccount>>, repair: RepairInput) =>
  repairs.submit(actor, { submissionId: randomUUID(), repair });

describe.sequential('reparos detalhados', () => {
  it('publica somente após revisão e não expõe dados de conta', async () => {
    const f = await fixture();
    const sent = await submit(f.owner, f.repair);
    expect(await repairs.published(f.slug, f.variantId)).toEqual([]);
    expect((await repairs.mine(f.owner))[0]).toMatchObject({ id: sent.id, status: 'pending' });
    expect((await repairs.queue(f.moderator)).some((r) => r.id === sent.id)).toBe(true);
    await repairs.moderate(f.moderator, { repairId: sent.id, decision: 'published', reason: 'Coerente.' });
    const published = await repairs.published(f.slug, f.variantId);
    expect(published).toHaveLength(1);
    expect(published[0]).toMatchObject({ reviewId: f.reviewId, symptom: 'Parou de centrifugar.', costCents: 35000 });
    expect(published[0]).not.toHaveProperty('ownerId');
    expect(published[0]).not.toHaveProperty('displayName');
    expect(
      (
        await pool.query(
          "SELECT count(*)::int AS n FROM moderation_actions WHERE target_type='repair' AND target_id=$1",
          [sent.id],
        )
      ).rows[0].n,
    ).toBe(1);
  });
  it('outra conta não registra, não lê e não retira reparo de relato alheio', async () => {
    const f = await fixture();
    const intruder = await newAccount();
    await expect(submit(intruder, f.repair)).rejects.toMatchObject({ status: 404 });
    const sent = await submit(f.owner, f.repair);
    expect(await repairs.mine(intruder)).toEqual([]);
    await expect(repairs.withdraw(intruder, sent.id)).rejects.toMatchObject({ status: 404 });
    expect((await repairs.mine(f.owner))[0]?.status).toBe('pending');
  });
  it('nega moderação de membro e do próprio reparo', async () => {
    const f = await fixture();
    const sent = await submit(f.owner, f.repair);
    const input = { repairId: sent.id, decision: 'published', reason: 'Teste.' };
    await expect(repairs.moderate(f.owner, input)).rejects.toMatchObject({ status: 403 });
    await pool.query("UPDATE users SET role='moderator' WHERE id=$1", [f.owner.id]);
    await expect(repairs.moderate({ ...f.owner, role: 'moderator' }, input)).rejects.toMatchObject({ status: 403 });
    expect((await repairs.queue({ ...f.owner, role: 'moderator' })).some((r) => r.id === sent.id)).toBe(false);
    expect(await repairs.published(f.slug, f.variantId)).toEqual([]);
  });
  it('recusa mês anterior ao início de uso', async () => {
    const f = await fixture();
    await expect(submit(f.owner, { ...f.repair, occurredMonth: '2019-12' })).rejects.toMatchObject({ status: 422 });
    expect(await repairs.mine(f.owner)).toEqual([]);
  });
  it('repetir o envio não duplica e o mesmo envio não serve para outra conta', async () => {
    const f = await fixture();
    const input = { submissionId: randomUUID(), repair: f.repair };
    const results = await Promise.all([repairs.submit(f.owner, input), repairs.submit(f.owner, input)]);
    expect(results[0]?.id).toBe(results[1]?.id);
    expect(await repairs.mine(f.owner)).toHaveLength(1);
    const other = await fixture();
    await expect(
      repairs.submit(other.owner, { submissionId: input.submissionId, repair: other.repair }),
    ).rejects.toMatchObject({ status: 409 });
  });
  it('retirar o relato esconde os reparos e impede novos envios e decisões', async () => {
    const f = await fixture();
    const published = await submit(f.owner, f.repair);
    await repairs.moderate(f.moderator, { repairId: published.id, decision: 'published', reason: 'Teste.' });
    const pending = await submit(f.owner, { ...f.repair, symptom: 'Vazamento na mangueira.' });
    await reviews.withdraw(f.owner, f.reviewId);
    expect(await repairs.published(f.slug, f.variantId)).toEqual([]);
    expect((await repairs.queue(f.moderator)).some((r) => r.id === pending.id)).toBe(false);
    await expect(
      repairs.moderate(f.moderator, { repairId: pending.id, decision: 'published', reason: 'Teste.' }),
    ).rejects.toMatchObject({ status: 409 });
    await expect(submit(f.owner, f.repair)).rejects.toMatchObject({ status: 409 });
  });
  it('o dono retira o reparo e ele sai da fila e do público', async () => {
    const f = await fixture();
    const sent = await submit(f.owner, f.repair);
    await repairs.moderate(f.moderator, { repairId: sent.id, decision: 'published', reason: 'Teste.' });
    await repairs.withdraw(f.owner, sent.id);
    await repairs.withdraw(f.owner, sent.id);
    expect(await repairs.published(f.slug, f.variantId)).toEqual([]);
    expect(await repairs.mine(f.owner)).toEqual([]);
  });
  it('limita 20 reparos ativos por produto do mesmo dono', async () => {
    const f = await fixture();
    for (let i = 0; i < 20; i++) await submit(f.owner, { ...f.repair, symptom: `Problema sintético ${i}.` });
    await expect(submit(f.owner, f.repair)).rejects.toMatchObject({ status: 422 });
    await repairs.withdraw(f.owner, (await repairs.mine(f.owner))[0]!.id);
    await expect(submit(f.owner, f.repair)).resolves.toMatchObject({ message: 'Reparo enviado para revisão.' });
  });
});
