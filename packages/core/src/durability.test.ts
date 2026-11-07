import { describe, expect, it } from 'vitest';
import { durabilitySummary, usageBand, usageMonths, type DurabilityReport } from './index';

const report = (overrides: Partial<DurabilityReport> = {}): DurabilityReport => ({
  startedUsing: '2020-01',
  confirmedMonth: '2026-11',
  functioning: 'working',
  hadRepair: false,
  ...overrides,
});

describe('tempo de uso declarado', () => {
  it('conta meses completos entre início e confirmação', () => {
    expect(usageMonths('2026-11', '2026-11')).toBe(0);
    expect(usageMonths('2025-12', '2026-11')).toBe(11);
    expect(usageMonths('2020-01', '2026-11')).toBe(82);
  });
  it.each([
    ['2026-13', '2026-11'],
    ['2026-1', '2026-11'],
    ['2026-12', '2026-11'],
    ['', '2026-11'],
  ])('rejeita mês inválido ou posterior à confirmação: %s', (start, end) => {
    expect(usageMonths(start, end)).toBeNull();
  });
  it.each([
    [0, 'under_1'],
    [11, 'under_1'],
    [12, '1_2'],
    [23, '1_2'],
    [24, '2_3'],
    [36, '3_5'],
    [59, '3_5'],
    [60, '5_plus'],
  ] as const)('%i meses ficam na faixa %s', (months, band) => {
    expect(usageBand(months)).toBe(band);
  });
});

describe('resumo de durabilidade declarada', () => {
  it('sem relatos, tudo zero e faixas estáveis', () => {
    const summary = durabilitySummary([]);
    expect(summary.total).toBe(0);
    expect(summary.functioning).toEqual({ working: 0, with_problem: 0, not_working: 0 });
    expect(summary.byUsage.map((band) => band.band)).toEqual(['under_1', '1_2', '2_3', '3_5', '5_plus']);
  });
  it('soma situação, reparos e faixas, inclusive linhas agrupadas pelo banco', () => {
    const summary = durabilitySummary([
      report({ startedUsing: '2026-06', count: 3 }),
      report({ startedUsing: '2024-06', functioning: 'with_problem', hadRepair: true }),
      report({ startedUsing: '2019-01', functioning: 'not_working', hadRepair: true, count: 2 }),
    ]);
    expect(summary.total).toBe(6);
    expect(summary.functioning).toEqual({ working: 3, with_problem: 1, not_working: 2 });
    expect(summary.hadRepair).toBe(3);
    expect(summary.byUsage.find((band) => band.band === 'under_1')).toMatchObject({ total: 3, working: 3 });
    expect(summary.byUsage.find((band) => band.band === '2_3')).toMatchObject({ total: 1, with_problem: 1 });
    expect(summary.byUsage.find((band) => band.band === '5_plus')).toMatchObject({ total: 2, not_working: 2 });
  });
  it('linha fora do contrato não entra em nenhuma contagem', () => {
    const summary = durabilitySummary([
      report(),
      report({ startedUsing: '2027-01' }),
      report({ count: 0 }),
      report({ count: 1.5 }),
      report({ functioning: 'broken' as DurabilityReport['functioning'] }),
    ]);
    expect(summary.total).toBe(1);
    expect(summary.byUsage.reduce((sum, band) => sum + band.total, 0)).toBe(1);
  });
  it('não produz percentual, nota ou estimativa de vida útil', () => {
    const summary = durabilitySummary([report()]);
    expect(Object.keys(summary).sort()).toEqual(['byUsage', 'functioning', 'hadRepair', 'total']);
  });
});
