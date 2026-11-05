import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ env: vi.fn(), query: vi.fn(), limit: vi.fn() }));
vi.mock('@/lib/env', () => ({ readServerEnv: mocks.env }));
vi.mock('./database', () => ({ database: () => ({ query: mocks.query }) }));
vi.mock('./limits', () => ({ enforceLimit: mocks.limit }));
import { preflight } from './preflight';
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
