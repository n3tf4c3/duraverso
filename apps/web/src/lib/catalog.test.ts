import { describe, it, expect } from 'vitest';
import { catalog, catalogResponse, washingMachineCatalog } from './catalog';
import { applianceCatalog } from './catalog-appliances';
import { brands, catalogResponseSchema, isValidGtin, productCategories, productCategory, productSchema } from '@duraverso/core';
import { barcodeEvidence } from './catalog-evidence';
import { GET } from '../app/api/v1/products/route';

describe('catálogo e contrato público', () => {
  it('amplia o catálogo com modelos distintos, preservando as 20 lavadoras e sem liberar avaliações', () => {
    expect(catalog.length).toBeGreaterThanOrEqual(259);
    expect(washingMachineCatalog).toHaveLength(20);
    expect(new Set(catalog.map((p) => p.slug)).size).toBe(catalog.length);
    expect(new Set(catalog.map((p) => `${p.brand}:${p.model}`)).size).toBe(catalog.length);
    expect(catalog.every((p) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug))).toBe(true);
    expect([...new Set(catalog.map(productCategory))].sort()).toEqual([...productCategories].sort());
    expect([...new Set(catalog.map((p) => p.brand))].sort()).toEqual([...brands].sort());
    expect(catalog.every((p) => p.identification === 'candidate')).toBe(true);
    expect(catalog.every((p) => productSchema.safeParse(p).success)).toBe(true);
  });
  it('mantém códigos válidos, únicos e com evidência do fabricante', () => {
    const gtins = catalog.flatMap((p) => p.confirmedGtins);
    expect(gtins).toHaveLength(40);
    expect(new Set(gtins).size).toBe(gtins.length);
    expect(gtins.every(isValidGtin)).toBe(true);
    for (const [slug, evidence] of Object.entries(barcodeEvidence)) {
      expect(catalog.some((p) => p.slug === slug)).toBe(true);
      expect(evidence?.sourceUrl).toMatch(/^https:\/\/(loja\.electrolux\.com\.br|api\.electrolux-medialibrary\.com|www\.brastemp\.com\.br|www\.consul\.com\.br|www\.compracerta\.com\.br)\//);
      expect(evidence?.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    expect(washingMachineCatalog.every((p) => p.confirmedGtins.length === 2)).toBe(true);
    expect(applianceCatalog.every((p) => p.confirmedGtins.length === 0)).toBe(true);
  });
  it('inclui fontes oficiais e medidas próprias para cada categoria', () => {
    const officialHosts = ['www.brastemp.com.br', 'www.consul.com.br', 'loja.electrolux.com.br',
      'www.midea.com.br', 'www.midea.com', 'conteudo.midea.com.br', 'www.panasonic.com', 'loja.panasonic.com.br', 'parceiros.panasonic.com.br',
      'www.philips.com.br', 'www.walita.com.br', 'www.philips.com', 'www.wap.ind.br', 'wap.ind.br', 'loja.wap.ind.br',
      'www.lg.com', 'www.samsung.com', 'gree.com.br', 'www.generalww.com', 'registro.inmetro.gov.br',
      'sac.philco.com.br', 'www.hisense.com.br', 'www.tcl.com'];
    for (const category of productCategories.filter((value) => value !== 'washing_machine')) {
      const products = catalogResponse('', '', '', category).data;
      expect(products.length).toBeGreaterThanOrEqual(2);
      expect(products.every((product) => product.category === category && product.capacityKg === undefined)).toBe(true);
      for (const product of products) {
        expect(product.sourceCheckedAt).toBe('2026-11-06');
        expect(new URL(product.sourceUrl).protocol).toBe('https:');
        expect(officialHosts, product.sourceUrl).toContain(new URL(product.sourceUrl).hostname);
        expect(product.confirmedGtins).toEqual([]);
      }
    }
    expect(catalogResponse('CRB39AB').data[0]?.capacityLiters).toBe(342);
    expect(catalogResponse('BMS46AB').data[0]?.capacityLiters).toBe(32);
    expect(catalogResponse('CFO4NAB').data[0]?.burnerCount).toBe(4);
    expect(catalogResponse('', '', 'small', 'refrigerator').total).toBe(0);
  });
  it('cada código conferido encontra exatamente seu modelo pela API', async () => {
    for (const product of catalog) {
      for (const gtin of product.confirmedGtins) {
        const response = await GET(new Request(`http://localhost/api/v1/products?q=${gtin}`));
        expect(response.status).toBe(200);
        const result = catalogResponseSchema.parse(await response.json());
        expect(result.total).toBe(1);
        expect(result.data[0]?.slug).toBe(product.slug);
      }
    }
  });
  it('encontra conjuntos completos com marca e categoria combinadas', async () => {
    const airConditioners = catalog.filter((product) => product.category === 'air_conditioner');
    for (const brand of new Set(airConditioners.map((product) => product.brand))) {
      const products = airConditioners.filter((product) => product.brand === brand);
      expect(products.length).toBeGreaterThan(0);
      for (const product of products) {
        expect(product.category).toBe('air_conditioner');
        expect(product.coolingCapacityBtuH).toBeGreaterThan(0);
        for (const q of [product.model, product.model.replaceAll('/', ' ')]) {
          const response = await GET(new Request(`http://localhost/api/v1/products?${new URLSearchParams({ q, brand, category: 'air_conditioner' })}`));
          expect(response.status).toBe(200);
          const result = catalogResponseSchema.parse(await response.json());
          expect(result.data.map((item) => item.slug)).toEqual([product.slug]);
        }
      }
    }
  });
  it('busca capacidade de refrigeração e referências completas sem misturar unidades', async () => {
    const expected = catalog.filter((product) => product.category === 'air_conditioner' && product.coolingCapacityBtuH === 12000);
    expect(expected.length).toBeGreaterThan(0);
    for (const q of ['12000 BTU', '12.000 BTU/h', '12,000 BTU/h']) {
      const response = await GET(new Request(`http://localhost/api/v1/products?${new URLSearchParams({ q, category: 'air_conditioner' })}`));
      expect(response.status).toBe(200);
      expect((await response.json()).data.map((product: { slug: string }) => product.slug)).toEqual(expected.map((product) => product.slug));
    }
    expect(catalogResponse('JI12F/JE12F').data.map((product) => product.model)).toEqual(['JI12F/JE12F']);
    expect(catalogResponse('12000 BTU', '', '', 'vacuum_cleaner').total).toBe(0);
    expect(catalogResponse('', '', 'large', 'air_conditioner').total).toBe(0);
  });
  it('não aproxima código desconhecido, parcial ou digitado incorretamente', () => {
    expect(catalogResponse('7896584072144').total).toBe(0);
    expect(catalogResponse('789658407214').total).toBe(0);
    expect(catalogResponse('96385074').total).toBe(0);
    expect(catalogResponse('7909641317467').total).toBe(0);
    expect(catalogResponse('7896584072143', 'Consul').total).toBe(0);
    expect(catalogResponse('7896584072143', '', 'large').total).toBe(0);
  });
  it('não confunde os quatro modelos substituídos com seus sucessores no catálogo', () => {
    for (const model of ['BWK12A', 'CWB08A', 'CWB09A', 'CWH11B']) {
      expect(catalogResponse(model).total).toBe(0);
    }
    // Código encontrado somente no varejo para BWK12AB: não pertence ao BWM13AB.
    expect(catalogResponse('7891129498204').total).toBe(0);
    expect(catalogResponse('7891129614529').data[0]?.model).toBe('BWM13AB');
  });
  it('o contrato recusa um código truncado ou com dígito incorreto', () => {
    expect(productSchema.safeParse({ ...catalog[0], confirmedGtins: ['79095693584'] }).success).toBe(false);
    expect(productSchema.safeParse({ ...catalog[0], confirmedGtins: ['7896584072144'] }).success).toBe(false);
  });
  it('retorna somente o modelo pesquisado', () => {
    const result = catalogResponse('lac12');
    expect(result.total).toBe(1); expect(result.data[0]?.model).toBe('LAC12');
  });
  it('a rota HTTP respeita o contrato compartilhado', async () => {
    const response = await GET(new Request('http://localhost/api/v1/products?brand=Consul'));
    expect(response.status).toBe(200);
    const parsed = catalogResponseSchema.parse(await response.json());
    expect(parsed.total).toBe(catalog.filter((p) => p.brand === 'Consul').length); expect(parsed.data.every((p) => p.brand === 'Consul')).toBe(true);
  });
  it('a API combina categoria, marca e busca sem converter unidades em kg', async () => {
    const response = await GET(new Request('http://localhost/api/v1/products?category=refrigerator&brand=Consul&q=342'));
    expect(response.status).toBe(200);
    const result = catalogResponseSchema.parse(await response.json());
    expect(result.total).toBe(1);
    expect(result.data[0]?.model).toBe('CRB39AB');
    expect(result.data[0]?.capacityKg).toBeUndefined();
    const washers = await GET(new Request('http://localhost/api/v1/products?category=washing_machine'));
    expect(catalogResponseSchema.parse(await washers.json()).total).toBe(20);
  });
  it('recusa consulta excessiva e filtro inválido', async () => {
    expect((await GET(new Request(`http://localhost/api/v1/products?q=${'a'.repeat(121)}`))).status).toBe(400);
    expect((await GET(new Request('http://localhost/api/v1/products?brand=Desconhecida'))).status).toBe(400);
    expect((await GET(new Request('http://localhost/api/v1/products?category=Desconhecida'))).status).toBe(400);
  });
});
