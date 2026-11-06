import { describe, expect, it } from 'vitest';
import { catalogQuerySchema, filterCatalog, prepareCatalog, productCategory, productSchema, reconcileCatalog,
  searchProducts, type Product } from './index';

const identity = { id: 'fixture', slug: 'fixture', brand: 'Consul' as const, model: 'Fixture',
  sourceUrl: 'https://example.test/model', sourceCheckedAt: '2026-11-06', identification: 'candidate' as const, confirmedGtins: [] };
const washer: Product = { ...identity, capacityKg: 9 };
const refrigerator: Product = { ...identity, id: 'fridge', slug: 'fridge', model: 'Fridge', category: 'refrigerator', capacityLiters: 300 };
const microwave: Product = { ...identity, id: 'micro', slug: 'micro', model: 'Micro', category: 'microwave', capacityLiters: 32 };
const stove: Product = { ...identity, id: 'stove', slug: 'stove', model: 'Stove', category: 'stove', burnerCount: 4 };
const products = [washer, refrigerator, microwave, stove];

describe('categorias e medidas do catálogo', () => {
  it('preserva o contrato das lavadoras legadas sem exigir campo novo', () => {
    expect(productSchema.parse(washer)).toEqual(washer);
    expect(productCategory(washer)).toBe('washing_machine');
    expect(searchProducts(products, '', '', 'small')).toEqual([washer]);
  });
  it('aceita medidas próprias de cada categoria e jamais usa litros/bocas como kg', () => {
    for (const product of products) expect(productSchema.parse(product)).toEqual(product);
    expect(searchProducts(products, '', '', 'large')).toEqual([]);
    expect(searchProducts(products, '', '', 'small', 'refrigerator')).toEqual([]);
    expect(searchProducts(products, '', '', '', 'refrigerator')).toEqual([refrigerator]);
  });
  it('recusa categoria desconhecida e medidas conflitantes, negativas ou fracionadas para bocas', () => {
    for (const product of [identity, { ...washer, category: 'freezer' }, { ...refrigerator, capacityKg: 20 },
      { ...washer, capacityLiters: 30 }, { ...microwave, burnerCount: 4 }, { ...stove, capacityLiters: 80 },
      { ...refrigerator, capacityLiters: 0 }, { ...stove, burnerCount: 2.5 }]) {
      expect(productSchema.safeParse(product).success).toBe(false);
    }
    expect(catalogQuerySchema.safeParse({ category: 'freezer' }).success).toBe(false);
  });
  it('busca categorias em português, inglês e espanhol e combina categoria com marca', () => {
    for (const query of ['geladeira', 'refrigerator', 'nevera', '300 litros']) {
      expect(searchProducts(products, query)).toEqual([refrigerator]);
    }
    for (const query of ['fogão', 'cocina', '4 bocas']) expect(searchProducts(products, query)).toEqual([stove]);
    expect(filterCatalog({ mode: 'local_catalog', data: products, total: 4 }, '', 'Consul', '', 'microwave').data).toEqual([microwave]);
  });
  it('não permite importar um modelo novo sem evidências de variante', () => {
    const plan = prepareCatalog([refrigerator], []);
    expect(plan.productsWithoutVariants).toEqual(['fridge']);
    expect(() => reconcileCatalog([refrigerator], [], { products: [], variants: [], gtins: [], evidence: [] })).toThrow('lacunas de evidência');
  });
});
