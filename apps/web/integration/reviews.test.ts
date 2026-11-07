import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { Pool } from 'pg';
import { randomUUID } from 'node:crypto';
import { ReviewService } from '@/server/reviews';
import { accountForGoogle, accountForSession } from '@/server/accounts';
import type { Database } from '@/server/database';
import type { Actor, ReviewInput } from '@duraverso/core';

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
const service = new ReviewService(db);
beforeAll(async () => {
  const marker = await pool.query('SELECT run_id FROM duraverso_test_guard.marker');
  expect(marker.rows).toEqual([{ run_id: process.env.TEST_RUN_ID }]);
});
afterAll(async () => {
  await pool.end();
});
async function fixture(verified = true) {
  const owner = await accountForGoogle(db, { sub: `test-${randomUUID()}`, email_verified: true });
  const moderator = await accountForGoogle(db, { sub: `test-${randomUUID()}`, email_verified: true });
  await pool.query("UPDATE users SET role='moderator' WHERE id=$1", [moderator.id]);
  moderator.role = 'moderator';
  const productId = randomUUID();
  const variantId = randomUUID();
  const slug = `test-${productId}`;
  await pool.query(
    "INSERT INTO products(id,slug,brand,model,capacity_kg,source_url,source_checked_at,verified) VALUES($1,$2,'Consul',$2,12,'https://example.org',now(),true)",
    [productId, slug],
  );
  await pool.query('INSERT INTO variants(id,product_id,manufacturer_code,voltage,verified) VALUES($1,$2,$3,127,$4)', [
    variantId,
    productId,
    slug,
    verified,
  ]);
  const review: ReviewInput = {
    variantId,
    rating: 4,
    startedUsing: '2020-01',
    acquired: 'new',
    functioning: 'working',
    hadRepair: false,
    buyAgain: 'yes',
    comment: 'Relato sintético restrito ao banco descartável.',
  };
  return { owner, moderator, productId, variantId, slug, review };
}
async function send(f: Awaited<ReturnType<typeof fixture>>, review = f.review) {
  return service.submit(f.owner, { submissionId: randomUUID(), review });
}
describe.sequential('avaliação persistente e revisão', () => {
  it('publica somente após revisão e não expõe dados privados', async () => {
    const f = await fixture();
    const sent = await send(f);
    expect(await service.published(f.slug, f.variantId)).toEqual([]);
    await service.moderate(f.moderator, { revisionId: sent.id, decision: 'published', reason: 'Relato consistente.' });
    const published = await service.published(f.slug, f.variantId);
    expect(published).toHaveLength(1);
    expect(published[0]?.rating).toBe(4);
    expect(published[0]).not.toHaveProperty('google_subject');
    expect(published[0]).not.toHaveProperty('ownerId');
    expect((await pool.query('SELECT * FROM moderation_actions WHERE target_id=$1', [sent.id])).rows).toHaveLength(1);
  });
  it('preserva a versão publicada durante edição e rejeição', async () => {
    const f = await fixture();
    const first = await send(f);
    await service.moderate(f.moderator, { revisionId: first.id, decision: 'published', reason: 'Aprovado.' });
    const edited = await send(f, {
      ...f.review,
      rating: 1,
      functioning: 'not_working',
      comment: 'Atualização pendente.',
    });
    expect((await service.published(f.slug, f.variantId))[0]).toMatchObject({ rating: 4, functioning: 'working' });
    await service.moderate(f.moderator, {
      revisionId: edited.id,
      decision: 'changes_requested',
      reason: 'Confira a data.',
    });
    expect((await service.published(f.slug, f.variantId))[0]?.rating).toBe(4);
    const mine = await service.mine(f.owner);
    expect(mine[0]).toMatchObject({ rating: 1, pendingStatus: 'changes_requested', reason: 'Confira a data.' });
    const corrected = await send(f, { ...f.review, rating: 2 });
    await service.moderate(f.moderator, { revisionId: corrected.id, decision: 'published', reason: 'Corrigido.' });
    expect((await service.published(f.slug, f.variantId))[0]?.rating).toBe(2);
    expect((await service.summary(f.slug, f.variantId)).count).toBe(1);
  });
  it('recusa variante não verificada', async () => {
    const f = await fixture(false);
    await expect(send(f)).rejects.toMatchObject({ status: 422 });
    expect(await service.mine(f.owner)).toEqual([]);
  });
  it('repetir envio não cria voto ou revisão duplicados', async () => {
    const f = await fixture();
    const input = { submissionId: randomUUID(), review: f.review };
    const results = await Promise.all([service.submit(f.owner, input), service.submit(f.owner, input)]);
    expect(results[0]?.id).toBe(results[1]?.id);
    expect(
      (await pool.query('SELECT count(*)::int AS n FROM review_revisions WHERE submission_id=$1', [input.submissionId]))
        .rows[0].n,
    ).toBe(1);
    expect(await service.mine(f.owner)).toHaveLength(1);
  });
  it('não permite ler ou retirar avaliação de outra conta', async () => {
    const f = await fixture();
    await send(f);
    const mine = await service.mine(f.owner);
    expect(await service.mine(f.moderator)).toEqual([]);
    await expect(service.withdraw(f.moderator, mine[0]!.id)).rejects.toMatchObject({ status: 404 });
    expect((await service.mine(f.owner))[0]?.status).toBe('pending');
  });
  it('nega moderação de membro e da própria contribuição', async () => {
    const f = await fixture();
    const sent = await send(f);
    await expect(
      service.moderate(f.owner, { revisionId: sent.id, decision: 'published', reason: 'Teste.' }),
    ).rejects.toMatchObject({ status: 403 });
    await pool.query("UPDATE users SET role='moderator' WHERE id=$1", [f.owner.id]);
    await expect(
      service.moderate(
        { ...f.owner, role: 'moderator' },
        { revisionId: sent.id, decision: 'published', reason: 'Teste.' },
      ),
    ).rejects.toMatchObject({ status: 403 });
    expect(await service.published(f.slug, f.variantId)).toEqual([]);
  });
  it('retirada remove publicação e cancela revisão pendente', async () => {
    const f = await fixture();
    const first = await send(f);
    await service.moderate(f.moderator, { revisionId: first.id, decision: 'published', reason: 'Teste.' });
    const edit = await send(f, { ...f.review, rating: 1 });
    const mine = await service.mine(f.owner);
    await service.withdraw(f.owner, mine[0]!.id);
    expect(await service.published(f.slug, f.variantId)).toEqual([]);
    await expect(
      service.moderate(f.moderator, { revisionId: edit.id, decision: 'published', reason: 'Teste.' }),
    ).rejects.toMatchObject({ status: 409 });
    expect((await service.queue(f.moderator)).some((r) => r.revisionId === edit.id)).toBe(false);
  });
  it('revogação invalida sessão e escritas com versão anterior', async () => {
    const f = await fixture();
    expect(await accountForSession(db, f.owner.id, 0)).not.toBeNull();
    await pool.query('UPDATE users SET session_version=session_version+1 WHERE id=$1', [f.owner.id]);
    expect(await accountForSession(db, f.owner.id, 0)).toBeNull();
    await expect(send(f)).rejects.toMatchObject({ status: 401 });
  });
  it('Google sem e-mail verificado não cria conta e não atribui administrador', async () => {
    await expect(accountForGoogle(db, { sub: 'bad', email_verified: false })).rejects.toThrow();
    const actor = await accountForGoogle(db, {
      sub: `test-${randomUUID()}`,
      email_verified: true,
      name: 'Nome privado',
      role: 'admin',
    });
    expect(actor).toMatchObject({ role: 'member', displayName: 'Proprietário' });
  });
  it('duas decisões concorrentes aguardam o lock e apenas uma é aplicada', async () => {
    const f = await fixture();
    const sent = await send(f);
    const held = await pool.connect();
    try {
      await held.query('BEGIN');
      await held.query(
        'SELECT o.id FROM ownerships o JOIN reviews r ON r.ownership_id=o.id JOIN review_revisions rv ON rv.review_id=r.id WHERE rv.id=$1 FOR UPDATE OF o',
        [sent.id],
      );
      const input = { revisionId: sent.id, decision: 'published', reason: 'Teste de disputa.' };
      const pending = Promise.allSettled([service.moderate(f.moderator, input), service.moderate(f.moderator, input)]);
      let waiting = 0;
      const until = Date.now() + 5000;
      while (Date.now() < until) {
        const result = await pool.query(
          "SELECT count(*)::int AS n FROM pg_stat_activity WHERE application_name='duraverso-tests' AND wait_event_type='Lock'",
        );
        waiting = result.rows[0].n;
        if (waiting >= 2) break;
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
      expect(waiting).toBeGreaterThanOrEqual(2);
      await held.query('COMMIT');
      const settled = await pending;
      expect(settled.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
      expect(settled.filter((r) => r.status === 'rejected')).toHaveLength(1);
      expect(
        (await pool.query('SELECT count(*)::int AS n FROM moderation_actions WHERE target_id=$1', [sent.id])).rows[0].n,
      ).toBe(1);
    } finally {
      await held.query('ROLLBACK');
      held.release();
    }
  });
  it('nota aparece com 20 proprietários e desaparece após retirada', async () => {
    const f = await fixture();
    const owners: Actor[] = [];
    for (let i = 0; i < 20; i++) {
      const owner = await accountForGoogle(db, { sub: `test-${randomUUID()}`, email_verified: true });
      owners.push(owner);
      const sent = await service.submit(owner, { submissionId: randomUUID(), review: f.review });
      await service.moderate(f.moderator, { revisionId: sent.id, decision: 'published', reason: 'Teste.' });
      if (i === 18) expect(await service.summary(f.slug, f.variantId)).toEqual({ count: 19, average: null });
    }
    expect(await service.summary(f.slug, f.variantId)).toEqual({ count: 20, average: 4 });
    const mine = await service.mine(owners[0]!);
    await service.withdraw(owners[0]!, mine[0]!.id);
    expect(await service.summary(f.slug, f.variantId)).toEqual({ count: 19, average: null });
  });
  it('durabilidade conta só relatos publicados, com a versão aprovada', async () => {
    const f = await fixture();
    const thisMonth = new Date().toISOString().slice(0, 7);
    const publish = async (review: ReviewInput) => {
      const owner = await accountForGoogle(db, { sub: `test-${randomUUID()}`, email_verified: true });
      const sent = await service.submit(owner, { submissionId: randomUUID(), review });
      await service.moderate(f.moderator, { revisionId: sent.id, decision: 'published', reason: 'Teste.' });
      return owner;
    };
    await publish(f.review);
    await publish({ ...f.review, startedUsing: thisMonth, functioning: 'with_problem', hadRepair: true });
    // Edição pendente não muda a situação publicada.
    const edited = await publish(f.review);
    await service.submit(edited, { submissionId: randomUUID(), review: { ...f.review, functioning: 'not_working' } });
    // Pendente, retirado e conta desativada ficam fora.
    const pending = await accountForGoogle(db, { sub: `test-${randomUUID()}`, email_verified: true });
    await service.submit(pending, { submissionId: randomUUID(), review: { ...f.review, functioning: 'not_working' } });
    const withdrawn = await publish({ ...f.review, functioning: 'not_working' });
    await service.withdraw(withdrawn, (await service.mine(withdrawn))[0]!.id);
    const disabled = await publish({ ...f.review, functioning: 'not_working' });
    await pool.query('UPDATE users SET disabled_at=now() WHERE id=$1', [disabled.id]);

    const durability = await service.durability(f.slug, f.variantId);
    expect(durability.total).toBe((await service.summary(f.slug, f.variantId)).count);
    expect(durability).toMatchObject({
      total: 3,
      functioning: { working: 2, with_problem: 1, not_working: 0 },
      hadRepair: 1,
    });
    const bands = Object.fromEntries(durability.byUsage.map((band) => [band.band, band.total]));
    expect(bands).toMatchObject({ under_1: 1, '5_plus': 2 });
  });
});
