import { describe, it, expect } from 'vitest';
import { catalog, catalogResponse } from './catalog';
import { catalogResponseSchema } from '@duraverso/core';
import { GET } from '../app/api/v1/products/route';

describe('catálogo e contrato público', () => {
  it('expõe 20 candidatos distintos, sem GTIN inventado', () => {
    expect(catalog).toHaveLength(20);
    expect(new Set(catalog.map((p) => p.slug)).size).toBe(20);
    expect(catalog.every((p) => p.identification === 'candidate' && p.confirmedGtins.length === 0)).toBe(true);
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
