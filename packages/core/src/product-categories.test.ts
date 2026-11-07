import { describe, expect, it } from 'vitest';
import {
  catalogQuerySchema,
  filterCatalog,
  prepareCatalog,
  productCategory,
  productMeasurementField,
  productSchema,
  reconcileCatalog,
  searchProducts,
  type Product,
} from './index';

const identity = {
  id: 'fixture',
  slug: 'fixture',
  brand: 'Consul' as const,
  model: 'Fixture',
  sourceUrl: 'https://example.test/model',
  sourceCheckedAt: '2026-11-06',
  identification: 'candidate' as const,
  confirmedGtins: [],
};
const washer: Product = { ...identity, capacityKg: 9 };
const refrigerator: Product = {
  ...identity,
  id: 'fridge',
  slug: 'fridge',
  model: 'Fridge',
  category: 'refrigerator',
  capacityLiters: 300,
};
const microwave: Product = {
  ...identity,
  id: 'micro',
  slug: 'micro',
  model: 'Micro',
  category: 'microwave',
  capacityLiters: 32,
};
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
    for (const product of [
      identity,
      { ...washer, category: 'freezer' },
      { ...refrigerator, capacityKg: 20 },
      { ...washer, capacityLiters: 30 },
      { ...microwave, burnerCount: 4 },
      { ...stove, capacityLiters: 80 },
      { ...refrigerator, capacityLiters: 0 },
      { ...stove, burnerCount: 2.5 },
    ]) {
      expect(productSchema.safeParse(product).success).toBe(false);
    }
    expect(catalogQuerySchema.safeParse({ category: 'iron' }).success).toBe(false);
  });
  it('busca categorias em português, inglês e espanhol e combina categoria com marca', () => {
    for (const query of ['geladeira', 'refrigerator', 'nevera', '300 litros']) {
      expect(searchProducts(products, query)).toEqual([refrigerator]);
    }
    for (const query of ['fogão', 'cocina', '4 bocas']) expect(searchProducts(products, query)).toEqual([stove]);
    expect(
      filterCatalog({ mode: 'local_catalog', data: products, total: 4 }, '', 'Consul', '', 'microwave').data,
    ).toEqual([microwave]);
  });
  it('não permite importar um modelo novo sem evidências de variante', () => {
    const plan = prepareCatalog([refrigerator], []);
    expect(plan.productsWithoutVariants).toEqual(['fridge']);
    expect(() => reconcileCatalog([refrigerator], [], { products: [], variants: [], gtins: [], evidence: [] })).toThrow(
      'lacunas de evidência',
    );
  });
  it('distingue litros, serviços, bocas e potência nas categorias ampliadas', () => {
    const extended: Product[] = [
      { ...identity, category: 'freezer', capacityLiters: 200 },
      { ...identity, category: 'oven', capacityLiters: 80 },
      { ...identity, category: 'cooktop', burnerCount: 5 },
      { ...identity, category: 'dishwasher', placeSettings: 14 },
      { ...identity, category: 'air_fryer', capacityLiters: 4.1 },
      { ...identity, category: 'blender', capacityLiters: 2.1 },
      { ...identity, category: 'vacuum_cleaner', powerWatts: 1500 },
      { ...identity, category: 'coffee_maker', capacityLiters: 1.25 },
    ];
    for (const product of extended) {
      expect(productSchema.parse(product)).toEqual(product);
      expect(product[productMeasurementField(product)]).toBeGreaterThan(0);
      expect(searchProducts([product], '', '', 'large')).toEqual([]);
    }
    expect(searchProducts(extended, '14 serviços')).toEqual([extended[3]]);
    expect(searchProducts(extended, '1500 watts')).toEqual([extended[6]]);
    expect(searchProducts(extended, 'freidora')).toEqual([extended[4]]);
    expect(searchProducts(extended, 'cafetera')).toEqual([extended[7]]);
    for (const product of [
      { ...identity, category: 'dishwasher', capacityLiters: 14 },
      { ...identity, category: 'vacuum_cleaner', placeSettings: 14 },
      { ...identity, category: 'coffee_maker', powerWatts: 900 },
      { ...identity, category: 'dishwasher', placeSettings: 14.5 },
      { ...identity, category: 'vacuum_cleaner', powerWatts: 0 },
    ]) {
      expect(productSchema.safeParse(product).success).toBe(false);
    }
  });
  it('aceita somente as marcas catalogadas também no filtro público', () => {
    for (const brand of ['Midea', 'Panasonic', 'Philips Walita', 'WAP']) {
      expect(
        productSchema.safeParse({ ...identity, brand, category: 'coffee_maker', capacityLiters: 1.25 }).success,
      ).toBe(true);
      expect(catalogQuerySchema.safeParse({ brand }).success).toBe(true);
    }
    expect(productSchema.safeParse({ ...washer, brand: 'Marca sem fonte' }).success).toBe(false);
  });
  it('encontra referências com barra sem alterar a comparação exata de GTIN', () => {
    const blender: Product = {
      ...identity,
      brand: 'Philips Walita',
      model: 'RI2244/90',
      category: 'blender',
      capacityLiters: 3,
      confirmedGtins: ['7891129615250'],
    };
    for (const query of ['RI2244/90', 'RI224490', 'RI2244-90', 'RI 2244 90']) {
      expect(searchProducts([blender], query)).toEqual([blender]);
    }
    expect(searchProducts([blender], 'RI2244/91')).toEqual([]);
    expect(searchProducts([washer], '/')).toEqual([]);
    expect(searchProducts([blender], '7891129615250')).toEqual([blender]);
    expect(searchProducts([blender], '7891129/615250')).toEqual([]);
    expect(searchProducts([blender], '7891129,615250')).toEqual([]);
  });
  it('encontra medidas com vírgula decimal em português e ponto em inglês', () => {
    const fryer: Product = {
      ...identity,
      brand: 'Electrolux',
      model: 'EAF10',
      category: 'air_fryer',
      capacityLiters: 3.2,
    };
    const coffee: Product = { ...identity, model: 'Coffee', category: 'coffee_maker', capacityLiters: 1.25 };
    for (const query of ['3,2 L', '3.2 L', 'Electrolux 3,2 litros']) {
      expect(searchProducts([fryer, coffee], query)).toEqual([fryer]);
    }
    expect(searchProducts([fryer, coffee], '1,25 litros')).toEqual([coffee]);
    expect(searchProducts([fryer, coffee], '3,3 L')).toEqual([]);
  });
  it('separa refrigeração em BTU/h de potência elétrica e outras medidas', () => {
    const air: Product = { ...identity, brand: 'LG', category: 'air_conditioner', coolingCapacityBtuH: 12000 };
    expect(productSchema.parse(air)).toEqual(air);
    expect(productMeasurementField(air)).toBe('coolingCapacityBtuH');
    expect(productSchema.safeParse({ ...identity, category: 'air_conditioner' }).success).toBe(true);
    for (const product of [
      { ...air, powerWatts: 1200 },
      { ...air, capacityLiters: 12 },
      { ...air, coolingCapacityBtuH: 0 },
      { ...air, coolingCapacityBtuH: -12000 },
      { ...washer, coolingCapacityBtuH: 12000 },
      { ...identity, category: 'vacuum_cleaner', coolingCapacityBtuH: 12000 },
    ]) {
      expect(productSchema.safeParse(product).success).toBe(false);
    }
    for (const brand of [
      'LG',
      'Samsung',
      'Gree',
      'Daikin',
      'Fujitsu',
      'Carrier',
      'Springer Midea',
      'Elgin',
      'TCL',
      'Hisense',
      'Philco',
      'Agratto',
    ]) {
      expect(productSchema.safeParse({ ...air, brand }).success).toBe(true);
      expect(catalogQuerySchema.safeParse({ brand }).success).toBe(true);
    }
  });
  it('busca ar-condicionado e BTU em três idiomas com separadores locais sem alterar GTIN', () => {
    const air: Product = {
      ...identity,
      category: 'air_conditioner',
      coolingCapacityBtuH: 12000,
      confirmedGtins: ['7891129615250'],
    };
    const other: Product = { ...air, id: 'other', model: 'Other', coolingCapacityBtuH: 120000, confirmedGtins: [] };
    for (const query of ['ar-condicionado', 'ar condicionado', 'air conditioner', 'aire acondicionado']) {
      expect(searchProducts([air], query)).toEqual([air]);
    }
    for (const query of ['12000 BTU', '12.000 BTU/h', '12,000 BTU/h', 'ar condicionado 12.000 BTU']) {
      expect(searchProducts([air, other], query)).toEqual([air]);
    }
    expect(searchProducts([air, other], '', '', 'large')).toEqual([]);
    expect(searchProducts([air], '7891129615250')).toEqual([air]);
    expect(searchProducts([air], '7.891.129.615.250')).toEqual([]);
    expect(searchProducts([air], '7,891,129,615,250')).toEqual([]);
    expect(searchProducts([air], '9000 BTU')).toEqual([]);
  });
  it('mantém Midea e Springer Midea distintas no filtro de marca', () => {
    const midea: Product = { ...identity, brand: 'Midea', category: 'air_conditioner', coolingCapacityBtuH: 12000 };
    const springer: Product = { ...midea, id: 'springer', slug: 'springer', brand: 'Springer Midea' };
    const snapshot = { mode: 'local_catalog' as const, data: [midea, springer], total: 2 };
    expect(filterCatalog(snapshot, '', 'Midea').data).toEqual([midea]);
    expect(filterCatalog(snapshot, '', 'Springer Midea').data).toEqual([springer]);
    expect(searchProducts(snapshot.data, 'Springer Midea')).toEqual([springer]);
  });
});
