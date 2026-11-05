import { describe, it, expect } from 'vitest';
import { catalog, catalogResponse } from './catalog';
import { catalogResponseSchema, isValidGtin, productSchema } from '@duraverso/core';
import { barcodeEvidence } from './catalog-evidence';
import { GET } from '../app/api/v1/products/route';

describe('catálogo e contrato público', () => {
  it('expõe 20 modelos distintos, ainda sem liberar variantes para avaliações', () => {
    expect(catalog).toHaveLength(20);
    expect(new Set(catalog.map((p) => p.slug)).size).toBe(20);
    expect(catalog.every((p) => p.identification === 'candidate')).toBe(true);
  });
  it('mantém códigos válidos, únicos e com evidência do fabricante', () => {
    const gtins = catalog.flatMap((p) => p.confirmedGtins);
    expect(gtins).toHaveLength(16);
    expect(new Set(gtins).size).toBe(gtins.length);
    expect(gtins.every(isValidGtin)).toBe(true);
    for (const [slug, evidence] of Object.entries(barcodeEvidence)) {
      expect(catalog.some((p) => p.slug === slug)).toBe(true);
      expect(evidence?.sourceUrl).toMatch(/^https:\/\/(loja\.electrolux\.com\.br|api\.electrolux-medialibrary\.com)\//);
      expect(evidence?.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    expect(catalog.filter((p) => p.brand !== 'Electrolux').every((p) => p.confirmedGtins.length === 0)).toBe(true);
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
  it('não aproxima código desconhecido, parcial ou digitado incorretamente', () => {
    expect(catalogResponse('7896584072144').total).toBe(0);
    expect(catalogResponse('789658407214').total).toBe(0);
    expect(catalogResponse('96385074').total).toBe(0);
    expect(catalogResponse('7896584072143', 'Consul').total).toBe(0);
    expect(catalogResponse('7896584072143', '', 'large').total).toBe(0);
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
    expect(parsed.total).toBe(6); expect(parsed.data.every((p) => p.brand === 'Consul')).toBe(true);
  });
  it('recusa consulta excessiva e filtro inválido', async () => {
    expect((await GET(new Request(`http://localhost/api/v1/products?q=${'a'.repeat(121)}`))).status).toBe(400);
    expect((await GET(new Request('http://localhost/api/v1/products?brand=Desconhecida'))).status).toBe(400);
  });
});
