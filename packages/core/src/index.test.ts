import { describe, expect, it } from 'vitest';
import {
  canTransitionReview,
  communitySummary,
  isValidGtin,
  MAX_REVIEW_LENGTH,
  searchProducts,
  validateReview,
  type CurrentReview,
  type Product,
} from './index';

const reviews = (count: number): CurrentReview[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `r${i}`,
    ownerId: `u${i}`,
    modelId: 'model',
    variantId: '127v',
    rating: i % 2 ? 5 : 3,
    status: 'published',
    updatedAt: '2026-01-01T12:00:00Z',
  }));
describe('nota da comunidade', () => {
  it('não transforma ausência de relatos em nota zero', () => expect(communitySummary([], '127v').average).toBeNull());
  it('não destaca média com 19 proprietários', () => expect(communitySummary(reviews(19), '127v').average).toBeNull());
  it('publica média preliminar com 20 proprietários', () =>
    expect(communitySummary(reviews(20), '127v')).toMatchObject({ count: 20, average: 4, preliminary: true }));
  it('atualização não adiciona voto', () => {
    const input = reviews(20);
    const original = input[0]!;
    const updated = { ...original, id: 'updated', rating: 5, updatedAt: '2026-02-01T00:00:00Z' };
    expect(communitySummary([...input, updated], '127v')).toMatchObject({ count: 20, average: 4.1 });
    expect(communitySummary([updated, ...input], '127v').average).toBe(4.1);
  });
  it('retirada faz a média desaparecer abaixo de 20', () => {
    const input = reviews(20);
    input[0]!.status = 'withdrawn';
    expect(communitySummary(input, '127v')).toMatchObject({ count: 19, average: null });
  });
  it('não mistura variantes nem pendências', () => {
    const input = reviews(20);
    input[0]!.variantId = '220v';
    input[1]!.status = 'pending';
    expect(communitySummary(input, '127v').count).toBe(18);
  });
  it('desconsidera uma nota inválida', () => {
    const input = reviews(20);
    input[0]!.rating = 6;
    expect(communitySummary(input, '127v').average).toBeNull();
  });
});

const valid = {
  variantId: '10000000-0000-4000-8000-000000000001',
  rating: 4,
  startedUsing: '2020-01',
  acquired: 'new',
  functioning: 'working',
  hadRepair: false,
  buyAgain: 'unsure',
  comment: '',
};
describe('formulário de experiência', () => {
  it('aceita o limite de comentário e dispensa texto', () => {
    expect(validateReview(valid).success).toBe(true);
    expect(validateReview({ ...valid, comment: 'a'.repeat(MAX_REVIEW_LENGTH) }).success).toBe(true);
  });
  it('recusa excesso de texto', () =>
    expect(validateReview({ ...valid, comment: 'a'.repeat(MAX_REVIEW_LENGTH + 1) }).success).toBe(false));
  it('recusa datas futuras, mês inválido e notas fracionadas', () => {
    expect(validateReview({ ...valid, startedUsing: '2099-01' }, new Date('2026-11-05')).success).toBe(false);
    expect(validateReview({ ...valid, startedUsing: '2020-13' }).success).toBe(false);
    expect(validateReview({ ...valid, rating: 3.5 }).success).toBe(false);
  });
  it('não aceita papel administrativo vindo do formulário', () =>
    expect(validateReview({ ...valid, role: 'admin' }).success).toBe(false));
});
describe('identificação', () => {
  const product: Product = {
    id: '1',
    slug: 'consul-cwh11b',
    brand: 'Consul',
    model: 'CWH11B',
    capacityKg: 11,
    sourceUrl: 'https://www.consul.com.br',
    sourceCheckedAt: '2026-11-05',
    identification: 'candidate',
    confirmedGtins: [],
  };
  it('busca ignora caixa, espaços no modelo e acentos', () => {
    expect(searchProducts([product], 'CWH 11B')).toHaveLength(1);
    expect(searchProducts([product], 'Cónsul')).toHaveLength(1);
  });
  it('combina filtros sem resultados incorretos', () => {
    expect(searchProducts([product], '', 'Consul', 'medium')).toHaveLength(1);
    expect(searchProducts([product], '', 'Brastemp')).toHaveLength(0);
    expect(searchProducts([product], '', '', 'large')).toHaveLength(0);
  });
  it('não associa um GTIN desconhecido por aproximação', () =>
    expect(searchProducts([product], '7896584072143')).toHaveLength(0));
  it('valida dígito de controle e rejeita códigos inválidos', () => {
    expect(isValidGtin('7896584072143')).toBe(true);
    expect(isValidGtin('7896584072144')).toBe(false);
    expect(isValidGtin('0000000000000')).toBe(false);
    expect(isValidGtin('abc')).toBe(false);
  });
});
describe('revisão', () => {
  it('permite publicar uma pendência', () => expect(canTransitionReview('pending', 'published')).toBe(true));
  it('exige motivo para correção e rejeição', () => {
    expect(canTransitionReview('pending', 'rejected')).toBe(false);
    expect(canTransitionReview('pending', 'changes_requested', '   ')).toBe(false);
    expect(canTransitionReview('pending', 'changes_requested', 'Confira o modelo.')).toBe(true);
  });
  it('não republica um relato retirado', () => expect(canTransitionReview('withdrawn', 'published')).toBe(false));
});
