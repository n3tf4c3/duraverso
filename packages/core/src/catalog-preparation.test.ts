import { describe, expect, it } from 'vitest';
import { prepareCatalog, type CatalogVariantEvidence, type Product } from './index';

const product: Product = {
  id: 'fixture',
  slug: 'fixture',
  brand: 'Consul',
  model: 'Fixture',
  capacityKg: 9,
  sourceUrl: 'https://example.test/model',
  sourceCheckedAt: '2026-11-06',
  identification: 'candidate',
  confirmedGtins: ['7891129615250', '7891129616219'],
};
const evidence: CatalogVariantEvidence = {
  productSlug: 'fixture',
  gtin: '7891129615250',
  manufacturerCode: 'TEST-A',
  codeKind: 'manufacturer_reference',
  voltage: 127,
  sourceUrl: 'https://example.test/gtin',
  voltageSourceUrl: 'https://example.test/voltage',
  checkedAt: '2026-11-06',
  note: 'Fixture de teste.',
};

describe('preparação documental do catálogo', () => {
  it('lista lacunas sem inferir a tensão do outro código', () => {
    const result = prepareCatalog([product], [evidence]);
    expect(result.mode).toBe('dry_run');
    expect(result.selectedCatalogCovered).toBe(false);
    expect(result.unresolvedGtins).toEqual([{ productSlug: 'fixture', gtin: '7891129616219' }]);
    expect(result.variants).toHaveLength(1);
  });
  it('não declara cobertura de modelo sem GTIN e sem variante', () => {
    const result = prepareCatalog([{ ...product, confirmedGtins: [] }], []);
    expect(result.selectedCatalogCovered).toBe(false);
    expect(result.productsWithoutVariants).toEqual(['fixture']);
  });
  it('recusa evidência de outro modelo, duplicidade e identidade ambígua', () => {
    expect(() => prepareCatalog([product], [{ ...evidence, productSlug: 'outro' }])).toThrow();
    expect(() => prepareCatalog([product], [evidence, evidence])).toThrow();
    expect(() => prepareCatalog([product], [evidence, { ...evidence, gtin: '7891129616219', voltage: 220 }])).toThrow();
    expect(() => prepareCatalog([product, { ...product, slug: 'outro' }], [])).toThrow();
    expect(() => prepareCatalog([product, product], [])).toThrow();
  });
  it('recusa 110V, GTIN inválido, fonte insegura e marcação de ativação', () => {
    for (const changed of [
      { voltage: 110 },
      { gtin: '7891129615251' },
      { voltageSourceUrl: 'http://example.test' },
      { verified: true },
      { manufacturerCode: '' },
    ]) {
      expect(() => prepareCatalog([product], [{ ...evidence, ...changed }])).toThrow();
    }
  });
});
