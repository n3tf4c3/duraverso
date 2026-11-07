import type { FunctioningStatus } from './constants';

// Durabilidade declarada: só contagens de relatos aprovados, sem percentual,
// nota ou estimativa de vida útil. O tempo de uso vai do mês de início declarado
// até o mês em que o dono confirmou a situação (aprovação da última versão).
export const usageBands = ['under_1', '1_2', '2_3', '3_5', '5_plus'] as const;
export type UsageBand = (typeof usageBands)[number];
export type DurabilityReport = {
  startedUsing: string;
  confirmedMonth: string;
  functioning: FunctioningStatus;
  hadRepair: boolean;
  /** Relatos idênticos agrupados pelo banco; padrão 1. */
  count?: number;
};
type StatusCounts = Record<FunctioningStatus, number>;
export type DurabilitySummary = {
  total: number;
  functioning: StatusCounts;
  hadRepair: number;
  byUsage: ({ band: UsageBand; total: number } & StatusCounts)[];
};

const month = /^(\d{4})-(0[1-9]|1[0-2])$/;
const statuses: readonly FunctioningStatus[] = ['working', 'with_problem', 'not_working'];

/** Meses completos entre dois meses AAAA-MM; null quando inválido ou invertido. */
export function usageMonths(startedUsing: string, confirmedMonth: string): number | null {
  const start = month.exec(startedUsing);
  const end = month.exec(confirmedMonth);
  if (!start || !end) return null;
  const months = (Number(end[1]) - Number(start[1])) * 12 + (Number(end[2]) - Number(start[2]));
  return months >= 0 ? months : null;
}

export function usageBand(months: number): UsageBand {
  if (months < 12) return 'under_1';
  if (months < 24) return '1_2';
  if (months < 36) return '2_3';
  if (months < 60) return '3_5';
  return '5_plus';
}

export function durabilitySummary(reports: readonly DurabilityReport[]): DurabilitySummary {
  const empty = (): StatusCounts => ({ working: 0, with_problem: 0, not_working: 0 });
  const summary: DurabilitySummary = {
    total: 0,
    functioning: empty(),
    hadRepair: 0,
    byUsage: usageBands.map((band) => ({ band, total: 0, ...empty() })),
  };
  for (const report of reports) {
    const count = report.count ?? 1;
    const months = usageMonths(report.startedUsing, report.confirmedMonth);
    // Linha fora do contrato não entra em nenhuma contagem, para os totais baterem entre si.
    if (!Number.isInteger(count) || count < 1 || months === null || !statuses.includes(report.functioning)) continue;
    const band = summary.byUsage[usageBands.indexOf(usageBand(months))]!;
    summary.total += count;
    summary.functioning[report.functioning] += count;
    band.total += count;
    band[report.functioning] += count;
    if (report.hadRepair) summary.hadRepair += count;
  }
  return summary;
}
