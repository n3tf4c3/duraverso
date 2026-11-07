import { describe, expect, it } from 'vitest';
import { MAX_REPAIR_COST_CENTS, parseRepairCost, repairModerationSchema, validateRepair } from './index';

const today = new Date('2026-11-07T12:00:00Z');
const repair = {
  reviewId: '00000000-0000-4000-8000-000000000001',
  occurredMonth: '2025-03',
  symptom: 'Parou de centrifugar.',
  repaired: true,
  resultingStatus: 'working',
  costCents: 35000,
  comment: '',
};

describe('contrato de reparo', () => {
  it('aceita reparo completo e custo ausente', () => {
    expect(validateRepair(repair, today).success).toBe(true);
    expect(validateRepair({ ...repair, costCents: null }, today).success).toBe(true);
  });
  it.each([
    ['mês futuro', { occurredMonth: '2026-12' }],
    ['mês inválido', { occurredMonth: '2025-13' }],
    ['problema vazio', { symptom: '  ' }],
    ['problema longo', { symptom: 'x'.repeat(501) }],
    ['custo negativo', { costCents: -1 }],
    ['custo fracionado', { costCents: 10.5 }],
    ['custo acima do limite', { costCents: MAX_REPAIR_COST_CENTS + 1 }],
    ['situação desconhecida', { resultingStatus: 'broken' }],
    ['campo extra', { ownerId: 'x' }],
  ])('recusa %s', (_label, override) => {
    expect(validateRepair({ ...repair, ...override }, today).success).toBe(false);
  });
  it('moderação de reparo só publica ou recusa, sempre com motivo', () => {
    const base = { repairId: repair.reviewId, reason: 'Relato consistente.' };
    expect(repairModerationSchema.safeParse({ ...base, decision: 'published' }).success).toBe(true);
    expect(repairModerationSchema.safeParse({ ...base, decision: 'changes_requested' }).success).toBe(false);
    expect(repairModerationSchema.safeParse({ ...base, decision: 'rejected', reason: ' ' }).success).toBe(false);
  });
});

describe('custo digitado em reais', () => {
  it.each([
    ['', null],
    ['350', 35000],
    ['350,5', 35050],
    ['1.250,90', 125090],
    ['1250,90', 125090],
  ])('%s vira %s', (text, cents) => {
    expect(parseRepairCost(text)).toBe(cents);
  });
  it.each(['abc', '-10', '10,999', '1.25', '100.000,01'])('recusa %s', (text) => {
    expect(parseRepairCost(text)).toBeUndefined();
  });
});
