import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ preflight: vi.fn() }));
vi.mock('./server/preflight', () => ({ preflight: mocks.preflight }));
import { register } from './instrumentation';
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('NEXT_RUNTIME', 'nodejs');
  vi.stubEnv('VERCEL', '1');
  vi.stubEnv('VERCEL_ENV', 'production');
  vi.stubEnv('DURAVERSO_MODE', 'preview');
});
afterEach(() => vi.unstubAllEnvs());
it('inicia a prévia na Vercel e mantém a verificação de configuração', async () => {
  await register();
  expect(mocks.preflight).toHaveBeenCalledOnce();
});
it('recusa habilitar contas fora do piloto antes de consultar serviços externos', async () => {
  vi.stubEnv('DURAVERSO_MODE', 'connected');
  await expect(register()).rejects.toThrow('projeto do piloto');
  expect(mocks.preflight).not.toHaveBeenCalled();
});
it('na produção do piloto, só inicia depois do preflight', async () => {
  vi.stubEnv('DURAVERSO_MODE', 'connected');
  vi.stubEnv('DURAVERSO_CONNECTED_HOST', 'vercel-pilot');
  mocks.preflight.mockRejectedValueOnce(new Error('Modo conectado indisponível'));
  await expect(register()).rejects.toThrow('Modo conectado indisponível');
  expect(mocks.preflight).toHaveBeenCalledOnce();
});
