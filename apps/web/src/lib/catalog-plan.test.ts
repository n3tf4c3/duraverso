import { describe, expect, it } from 'vitest';
import { catalogPlan } from './catalog-plan';
import { catalog, catalogResponse, washingMachineCatalog } from './catalog';

describe('evidências do catálogo selecionado', () => {
  it('expõe lacunas das novas categorias sem alterar o lote preparado para importação', () => {
    const complete = catalogPlan('all');
    expect(complete.products).toHaveLength(catalog.length);
    expect(complete.selectedCatalogCovered).toBe(false);
    expect(complete.productsWithoutVariants.sort()).toEqual(catalog.filter((product) =>
      !washingMachineCatalog.some((washer) => washer.slug === product.slug)).map((product) => product.slug).sort());
    expect(complete.unresolvedGtins).toEqual([]);
    expect(catalogPlan().products.map((product) => product.slug)).toEqual(washingMachineCatalog.map((product) => product.slug));
  });
  it('cobre os 40 códigos dos 20 modelos sem ativar avaliações', () => {
    const plan = catalogPlan();
    expect(plan.products).toHaveLength(20);
    expect(plan.variants).toHaveLength(40);
    expect(plan.selectedCatalogCovered).toBe(true);
    expect(plan.products.every((product) => product.identification === 'candidate')).toBe(true);
    for (const variant of plan.variants) {
      expect(catalogResponse(variant.gtin).data.map((product) => product.slug)).toEqual([variant.productSlug]);
      expect(variant).not.toHaveProperty('verified');
      const sourceHost = new URL(variant.sourceUrl).hostname;
      expect(['www.brastemp.com.br', 'www.consul.com.br', 'www.compracerta.com.br', 'loja.electrolux.com.br']).toContain(sourceHost);
      expect(new URL(variant.voltageSourceUrl).hostname).toBe(variant.codeKind === 'catalog_reference'
        ? 'loja.electrolux.com.br' : 'registro.inmetro.gov.br');
    }
  });
  it('preserva associações explícitas mesmo quando o texto comercial é ambíguo', () => {
    const { variants } = catalogPlan();
    expect(variants.find((variant) => variant.gtin === '7891129614529')).toMatchObject({ manufacturerCode: 'BWM13ABANA', voltage: 127 });
    expect(variants.find((variant) => variant.gtin === '7909569358405')).toMatchObject({ manufacturerCode: '900941710', codeKind: 'catalog_reference', voltage: 127 });
    expect(variants.find((variant) => variant.gtin === '7896584070774')).toMatchObject({ manufacturerCode: '900941407', voltage: 220 });
  });
});
