import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ env: vi.fn(), query: vi.fn(), limit: vi.fn() }));
vi.mock('@/lib/env', () => ({ readServerEnv: mocks.env }));
vi.mock('./database', () => ({ database: () => ({ query: mocks.query }) }));
vi.mock('./limits', () => ({ enforceLimit: mocks.limit }));
import { connectedSchemaReadinessSql, preflight } from './preflight';
beforeEach(() => { vi.resetAllMocks(); mocks.env.mockReturnValue({ DURAVERSO_MODE: 'connected' }); mocks.query.mockResolvedValue([{ ready: true }]); mocks.limit.mockResolvedValue(undefined); });
it('a prévia não acessa recursos externos', async () => {
  mocks.env.mockReturnValue({ DURAVERSO_MODE: 'preview' }); await preflight(); expect(mocks.query).not.toHaveBeenCalled(); expect(mocks.limit).not.toHaveBeenCalled();
});
it('impede início conectado sem schema, proteção ou configuração válidos', async () => {
  mocks.query.mockResolvedValueOnce([{ ready: false }]); await expect(preflight()).rejects.toThrow('Modo conectado indisponível');
  mocks.limit.mockRejectedValueOnce(new Error('synthetic-secret')); await expect(preflight()).rejects.toThrow('Modo conectado indisponível');
  mocks.env.mockImplementationOnce(() => { throw new Error('synthetic-secret'); }); await expect(preflight()).rejects.not.toThrow('synthetic-secret');
});
it('inicia somente após conferir banco e limitador', async () => { await preflight(); expect(mocks.query).toHaveBeenCalledOnce(); expect(mocks.limit).toHaveBeenCalledWith('auth', 'preflight'); });
it('exige a versão atual da migration, colunas e constraints antes de abrir modo conectado', async () => {
  await preflight();
  expect(mocks.query).toHaveBeenCalledWith(connectedSchemaReadinessSql);
  expect(connectedSchemaReadinessSql).toContain('duraverso_catalog_categories_version()');
  expect(connectedSchemaReadinessSql).toContain('duraverso_catalog_categories_version() >= 4');
  expect(connectedSchemaReadinessSql).toContain('pg_attribute');
  expect(connectedSchemaReadinessSql).toContain('product_category_measures');
  mocks.query.mockResolvedValueOnce([{ ready: false }]);
  await expect(preflight()).rejects.toThrow('Modo conectado indisponível');
});
