import { z } from 'zod';
import { functioningStatuses, MAX_REVIEW_LENGTH } from './constants';

export const MAX_REPAIR_SYMPTOM_LENGTH = 500;
/** Limite por produto de cada dono; reparos retirados não contam. */
export const MAX_REPAIRS_PER_OWNERSHIP = 20;
/** R$ 100.000,00 em centavos: acima disso o valor é tratado como erro de digitação. */
export const MAX_REPAIR_COST_CENTS = 10_000_000;

// O reparo pertence ao relato do próprio dono (reviewId); a posse é conferida no banco.
export const repairInputSchema = z.strictObject({
  reviewId: z.uuid(),
  occurredMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Informe mês e ano válidos.'),
  symptom: z
    .string()
    .trim()
    .min(3, 'Descreva o problema.')
    .max(MAX_REPAIR_SYMPTOM_LENGTH, `Use até ${MAX_REPAIR_SYMPTOM_LENGTH} caracteres no problema.`),
  repaired: z.boolean(),
  resultingStatus: z.enum(functioningStatuses),
  costCents: z.number().int().min(0).max(MAX_REPAIR_COST_CENTS).nullable(),
  comment: z.string().trim().max(MAX_REVIEW_LENGTH).default(''),
});
export type RepairInput = z.infer<typeof repairInputSchema>;
export const repairSubmissionSchema = z.strictObject({ submissionId: z.uuid(), repair: repairInputSchema });
export const repairModerationSchema = z.strictObject({
  repairId: z.uuid(),
  // Reparo não tem edição: o dono retira e registra de novo.
  decision: z.enum(['published', 'rejected']),
  reason: z.string().trim().min(1, 'Informe o motivo da decisão.').max(MAX_REVIEW_LENGTH),
});

/** O mês também é conferido no banco contra o início de uso do dono. */
export function validateRepair(input: unknown, today = new Date()) {
  return repairInputSchema
    .refine((repair) => repair.occurredMonth >= '1900-01' && repair.occurredMonth <= today.toISOString().slice(0, 7), {
      path: ['occurredMonth'],
      message: 'O mês do reparo não pode ser futuro.',
    })
    .safeParse(input);
}

/** Converte o texto digitado em reais (ex.: "350", "1.250,90") para centavos; vazio vira null. */
export function parseRepairCost(value: string): number | null | undefined {
  const text = value.trim();
  if (!text) return null;
  if (!/^\d{1,3}(?:\.?\d{3})*(?:,\d{1,2})?$/.test(text)) return undefined;
  const [reais, centavos = ''] = text.replace(/\./g, '').split(',');
  const cents = Number(reais) * 100 + Number(centavos.padEnd(2, '0'));
  return Number.isSafeInteger(cents) && cents <= MAX_REPAIR_COST_CENTS ? cents : undefined;
}
