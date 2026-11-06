import { z } from 'zod';

export { reconcileCatalog, type StoredCatalog, type CatalogImportConflict } from './catalog-import';

export const MIN_COMMUNITY_REVIEWS = 20;
export const MAX_REVIEW_LENGTH = 2000;
export const brands = ['Brastemp', 'Consul', 'Electrolux'] as const;
export const reviewStatuses = ['pending', 'changes_requested', 'published', 'rejected', 'withdrawn'] as const;
export const functioningStatuses = ['working', 'with_problem', 'not_working'] as const;

export const productSchema = z.object({
  id: z.string().min(1), slug: z.string().min(1), brand: z.enum(brands), model: z.string().min(1),
  capacityKg: z.number().positive(), sourceUrl: z.url(), sourceCheckedAt: z.iso.date(),
  identification: z.literal('candidate'), confirmedGtins: z.array(z.string().refine(isValidGtin, 'GTIN inválido.')),
});
export type Product = z.infer<typeof productSchema>;
export const verifiedProductSchema = productSchema.extend({ identification: z.literal('verified') });
export type PublicProduct = Product | z.infer<typeof verifiedProductSchema>;
// A resposta da prévia preserva os valores e campos existentes.
export const catalogResponseSchema = z.discriminatedUnion('mode', [
  z.object({ data: z.array(productSchema), total: z.number().int().nonnegative(), mode: z.literal('local_catalog') }),
  z.object({ data: z.array(verifiedProductSchema), total: z.number().int().nonnegative(), mode: z.literal('database_catalog') }),
]);
export type CatalogResponse = z.infer<typeof catalogResponseSchema>;
export const catalogQuerySchema = z.object({
  q: z.string().max(120).default(''), brand: z.union([z.enum(brands), z.literal('')]).default(''),
  capacity: z.enum(['', 'small', 'medium', 'large']).default(''),
});
export function filterCatalog(snapshot: CatalogResponse, query = '', brand = '', capacity = ''): CatalogResponse {
  const data = searchProducts<PublicProduct>(snapshot.data, query, brand, capacity);
  return catalogResponseSchema.parse({ mode: snapshot.mode, data, total: data.length });
}

export const reviewInputSchema = z.strictObject({
  variantId: z.uuid(), rating: z.number().int().min(1).max(5),
  startedUsing: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Informe mês e ano válidos.'),
  acquired: z.enum(['new', 'used']), functioning: z.enum(functioningStatuses),
  hadRepair: z.boolean(), buyAgain: z.enum(['yes', 'no', 'unsure']),
  comment: z.string().trim().max(MAX_REVIEW_LENGTH).default(''),
});
export type ReviewInput = z.infer<typeof reviewInputSchema>;
export const reviewSubmissionSchema = z.strictObject({ submissionId: z.uuid(), review: reviewInputSchema });
export const moderationInputSchema = z.strictObject({
  revisionId: z.uuid(), decision: z.enum(['published', 'changes_requested', 'rejected']),
  reason: z.string().trim().min(1, 'Informe o motivo da decisão.').max(MAX_REVIEW_LENGTH),
});
export const profileInputSchema = z.strictObject({ displayName: z.string().trim().min(2).max(80) });
export const statusLabels: Record<typeof reviewStatuses[number], string> = {
  pending: 'Em revisão', changes_requested: 'Precisa de ajuste', published: 'Publicado',
  rejected: 'Não publicado', withdrawn: 'Retirado',
};
export type Actor = { id: string; sessionVersion: number; role: 'member' | 'moderator' | 'admin'; displayName: string };
export function validateReview(input: unknown, today = new Date()) {
  return reviewInputSchema.refine(
    (review) => review.startedUsing >= '1900-01' && review.startedUsing <= today.toISOString().slice(0, 7),
    { path: ['startedUsing'], message: 'O início de uso deve estar entre janeiro de 1900 e o mês atual.' },
  ).safeParse(input);
}

export type CurrentReview = {
  id: string; ownerId: string; modelId: string; variantId: string;
  rating: number; status: typeof reviewStatuses[number]; updatedAt: string;
};

/** Recebe avaliações canônicas atuais; rascunhos de revisão ficam em outra coleção. */
export function communitySummary(reviews: readonly CurrentReview[], variantId: string) {
  const latest = new Map<string, CurrentReview>();
  for (const review of reviews) {
    if (!Number.isFinite(Date.parse(review.updatedAt))) continue;
    const key = JSON.stringify([review.ownerId, review.modelId]);
    const prior = latest.get(key);
    if (!prior || Date.parse(review.updatedAt) > Date.parse(prior.updatedAt) ||
        (review.updatedAt === prior.updatedAt && review.id > prior.id)) latest.set(key, review);
  }
  const eligible = [...latest.values()].filter((r) => r.variantId === variantId &&
    r.status === 'published' && Number.isInteger(r.rating) && r.rating >= 1 && r.rating <= 5);
  const distribution = [1, 2, 3, 4, 5].map((stars) => ({ stars, count: eligible.filter((r) => r.rating === stars).length }));
  return {
    count: eligible.length,
    average: eligible.length >= MIN_COMMUNITY_REVIEWS
      ? Math.round(eligible.reduce((sum, r) => sum + r.rating, 0) / eligible.length * 10) / 10 : null,
    preliminary: eligible.length >= MIN_COMMUNITY_REVIEWS, distribution,
  };
}

export function normalizeSearch(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
}
export function searchProducts<T extends PublicProduct>(products: readonly T[], query = '', brand = '', capacity = '') {
  const normalized = normalizeSearch(query).slice(0, 120);
  const compact = normalized.replace(/[\s-]/g, '');
  return products.filter((p) => {
    const text = normalizeSearch(`${p.brand} ${p.model} ${p.capacityKg} kg`);
    const textMatch = normalized.split(' ').every((token) => text.includes(token));
    const codeMatch = p.confirmedGtins.includes(compact);
    const modelMatch = normalizeSearch(p.model).replace(/[\s-]/g, '').includes(compact);
    const capacityMatch = !capacity || (capacity === 'small' && p.capacityKg <= 10) ||
      (capacity === 'medium' && p.capacityKg > 10 && p.capacityKg <= 13) || (capacity === 'large' && p.capacityKg > 13);
    return (!brand || p.brand === brand) && capacityMatch && (textMatch || codeMatch || modelMatch);
  });
}

export function isValidGtin(value: string) {
  if (!/^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(value) || /^0+$/.test(value)) return false;
  const digits = [...value].map(Number);
  const check = digits.pop();
  const sum = digits.reverse().reduce((total, digit, index) => total + digit * (index % 2 === 0 ? 3 : 1), 0);
  return (10 - sum % 10) % 10 === check;
}

const transitions: Record<typeof reviewStatuses[number], readonly typeof reviewStatuses[number][]> = {
  pending: ['published', 'changes_requested', 'rejected', 'withdrawn'],
  changes_requested: ['pending', 'withdrawn'], published: ['withdrawn', 'changes_requested'],
  rejected: ['pending', 'withdrawn'], withdrawn: [],
};
export function canTransitionReview(from: typeof reviewStatuses[number], to: typeof reviewStatuses[number], reason = '') {
  return transitions[from].includes(to) && (!['changes_requested', 'rejected'].includes(to) || reason.trim().length > 0);
}

const evidenceUrl = z.url().refine((value) => new URL(value).protocol === 'https:', 'A evidência deve usar HTTPS.');

// Identidade documental para preparação do banco, sem atribuir verified ou IDs persistentes.
export const catalogVariantEvidenceSchema = z.strictObject({
  productSlug: z.string().min(1),
  gtin: z.string().refine(isValidGtin, 'GTIN inválido.'),
  manufacturerCode: z.string().trim().min(1).max(100),
  codeKind: z.enum(['manufacturer_reference', 'catalog_reference']),
  voltage: z.union([z.literal(127), z.literal(220)]),
  sourceUrl: evidenceUrl,
  voltageSourceUrl: evidenceUrl,
  checkedAt: z.iso.date(),
  note: z.string().trim().min(1),
});
export type CatalogVariantEvidence = z.infer<typeof catalogVariantEvidenceSchema>;

export function prepareCatalog(productsInput: unknown, evidenceInput: unknown) {
  const products = z.array(productSchema).min(1).parse(productsInput);
  const variants = z.array(catalogVariantEvidenceSchema).parse(evidenceInput);
  const bySlug = new Map(products.map((product) => [product.slug, product]));
  if (bySlug.size !== products.length) throw new Error('Modelo duplicado no catálogo.');
  const names = products.map((product) => JSON.stringify([product.brand, product.model]));
  if (new Set(names).size !== names.length) throw new Error('Marca/modelo duplicado no catálogo.');

  const catalogGtins = products.flatMap((product) => product.confirmedGtins);
  if (new Set(catalogGtins).size !== catalogGtins.length) throw new Error('GTIN duplicado no catálogo.');
  const seenGtins = new Set<string>();
  const identities = new Set<string>();
  for (const variant of variants) {
    const product = bySlug.get(variant.productSlug);
    if (!product?.confirmedGtins.includes(variant.gtin)) {
      throw new Error('A evidência deve associar o GTIN ao mesmo modelo do catálogo.');
    }
    if (seenGtins.has(variant.gtin)) throw new Error('GTIN duplicado nas evidências.');
    seenGtins.add(variant.gtin);
    const identity = JSON.stringify([variant.productSlug, variant.manufacturerCode]);
    if (identities.has(identity)) throw new Error('Identificador de variante duplicado nas evidências.');
    identities.add(identity);
  }
  const unresolvedGtins = products.flatMap((product) => product.confirmedGtins
    .filter((gtin) => !seenGtins.has(gtin)).map((gtin) => ({ productSlug: product.slug, gtin })));
  const productsWithoutVariants = products.filter((product) => !variants.some((variant) => variant.productSlug === product.slug))
    .map((product) => product.slug);
  return {
    mode: 'dry_run' as const, products, variants, unresolvedGtins, productsWithoutVariants,
    // Apenas cobertura dos códigos já selecionados; não significa todas as versões do mercado.
    selectedCatalogCovered: unresolvedGtins.length === 0 && productsWithoutVariants.length === 0,
  };
}
