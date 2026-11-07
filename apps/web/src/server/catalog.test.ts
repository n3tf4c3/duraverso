import { afterEach, describe, expect, it, vi } from 'vitest';
import { catalogResponseSchema } from '@duraverso/core';
import { catalogGet } from './catalog-http';
import { PublicCatalogService } from './catalog';
import { readCatalog, readProduct } from './catalog-runtime';
import { catalog } from '@/lib/catalog';

const mocks = vi.hoisted(() => ({
  connected: vi.fn(() => false),
  query: vi.fn(),
  connection: vi.fn(),
  database: vi.fn(),
}));
vi.mock('@/lib/env', () => ({ isConnected: mocks.connected }));
vi.mock('./database', () => ({ database: mocks.database }));
vi.mock('next/server', () => ({ connection: mocks.connection }));
afterEach(() => {
  vi.resetAllMocks();
  mocks.connected.mockReturnValue(false);
});

describe('consulta pública do catálogo', () => {
  it('a prévia não abre conexão e conserva a resposta existente', async () => {
    const result = await readCatalog();
    expect(result).toMatchObject({ mode: 'local_catalog', total: catalog.length });
    expect(mocks.database).not.toHaveBeenCalled();
    expect(mocks.connection).not.toHaveBeenCalled();
    expect(await readProduct('nao-existe')).toBeUndefined();
  });
  it('conectado usa o banco em tempo de requisição e respeita catálogo vazio', async () => {
    mocks.connected.mockReturnValue(true);
    mocks.query.mockResolvedValue([]);
    mocks.database.mockReturnValue({ query: mocks.query });
    expect(await readCatalog()).toEqual({ mode: 'database_catalog', data: [], total: 0 });
    expect(mocks.connection).toHaveBeenCalled();
    expect(mocks.query).toHaveBeenCalledTimes(1);
    expect(await readProduct('electrolux-lac12')).toBeUndefined();
  });
  it('o contrato distingue candidatos locais de produtos publicados', () => {
    const row = {
      id: 'p',
      slug: 'p',
      brand: 'Consul',
      model: 'Teste',
      capacityKg: 9,
      sourceUrl: 'https://example.test',
      sourceCheckedAt: '2026-11-06',
      confirmedGtins: [],
    };
    expect(
      catalogResponseSchema.safeParse({
        mode: 'database_catalog',
        total: 1,
        data: [{ ...row, identification: 'candidate' }],
      }).success,
    ).toBe(false);
    expect(
      catalogResponseSchema.safeParse({
        mode: 'local_catalog',
        total: 1,
        data: [{ ...row, identification: 'verified' }],
      }).success,
    ).toBe(false);
  });
  it('falha ou dado inválido não expõe detalhes nem substitui pelo catálogo local', async () => {
    const query = vi.fn().mockRejectedValue(new Error('postgres://private:password@host/db'));
    const service = new PublicCatalogService({ query });
    const handler = catalogGet(() => service.read());
    const response = await handler(new Request('http://localhost/api/v1/products'));
    expect(response.status).toBe(503);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.json()).toEqual({ error: 'Catálogo temporariamente indisponível. Tente novamente.' });
    query.mockResolvedValue([{ brand: 'Invalid' }]);
    expect((await handler(new Request('http://localhost/api/v1/products'))).status).toBe(503);
  });
  it('consulta inválida é recusada antes de acessar o banco', async () => {
    const read = vi.fn();
    expect((await catalogGet(read)(new Request('http://localhost/api/v1/products?brand=Outra'))).status).toBe(400);
    expect((await catalogGet(read)(new Request('http://localhost/api/v1/products?category=other'))).status).toBe(400);
    expect(read).not.toHaveBeenCalled();
  });
  it('omite medidas nulas e filtra categorias no contrato conectado', async () => {
    const row = {
      id: 'fridge',
      slug: 'fridge',
      brand: 'Consul',
      model: 'Fixture',
      category: 'refrigerator',
      capacityKg: null,
      capacityLiters: 300,
      burnerCount: null,
      sourceUrl: 'https://example.test/model',
      sourceCheckedAt: '2026-11-06',
      identification: 'verified',
      confirmedGtins: [],
    };
    const service = new PublicCatalogService({ query: vi.fn().mockResolvedValue([row]) });
    const result = await service.read();
    expect(result.data[0]).toMatchObject({ category: 'refrigerator', capacityLiters: 300 });
    expect(result.data[0]).not.toHaveProperty('capacityKg');
    expect(result.data[0]).not.toHaveProperty('burnerCount');
    const handler = catalogGet(() => service.read());
    expect(
      await (await handler(new Request('http://localhost/api/v1/products?category=refrigerator'))).json(),
    ).toMatchObject({ total: 1 });
    expect(await (await handler(new Request('http://localhost/api/v1/products?capacity=large'))).json()).toMatchObject({
      total: 0,
    });
  });
});
