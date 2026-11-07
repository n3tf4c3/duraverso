import { describe, expect, it, vi } from 'vitest';
import type { Actor } from '@duraverso/core';
import { RepairService } from './repairs';

const actor: Actor = {
  id: '00000000-0000-4000-8000-000000000001',
  sessionVersion: 0,
  role: 'member',
  displayName: 'Proprietário',
};
const repair = {
  reviewId: '00000000-0000-4000-8000-000000000002',
  occurredMonth: '2025-03',
  symptom: 'Parou de centrifugar.',
  repaired: true,
  resultingStatus: 'working',
  costCents: 35000,
  comment: '',
};
function service() {
  const query = vi.fn(async () => [{ id: 'x' }]);
  return { query, repairs: new RepairService({ query } as never) };
}

describe('serviço de reparos sem banco', () => {
  it.each([
    ['sem submissionId', { repair }],
    ['mês futuro', { submissionId: crypto.randomUUID(), repair: { ...repair, occurredMonth: '2999-01' } }],
    ['campo extra', { submissionId: crypto.randomUUID(), repair: { ...repair, ownerId: actor.id } }],
  ])('recusa %s antes de consultar o banco', async (_label, input) => {
    const { query, repairs } = service();
    await expect(repairs.submit(actor, input)).rejects.toMatchObject({ status: 422 });
    expect(query).not.toHaveBeenCalled();
  });
  it('membro não lê a fila de moderação', async () => {
    const { query, repairs } = service();
    await expect(repairs.queue(actor)).rejects.toMatchObject({ status: 403 });
    expect(query).not.toHaveBeenCalled();
  });
  it('moderação de reparo não aceita pedido de ajuste', async () => {
    const { query, repairs } = service();
    await expect(
      repairs.moderate(actor, { repairId: repair.reviewId, decision: 'changes_requested', reason: 'Teste.' }),
    ).rejects.toMatchObject({ status: 422 });
    expect(query).not.toHaveBeenCalled();
  });
  it('erros do banco viram mensagens sem detalhes internos', async () => {
    const { query, repairs } = service();
    query.mockRejectedValueOnce(new Error('repair_limit'));
    await expect(repairs.submit(actor, { submissionId: crypto.randomUUID(), repair })).rejects.toMatchObject({
      status: 422,
      message: expect.stringContaining('Limite de reparos'),
    });
    query.mockRejectedValueOnce(new Error('connection to secret-host failed'));
    await expect(repairs.withdraw(actor, repair.reviewId)).rejects.toMatchObject({ status: 503 });
  });
});
