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
it('recusa habilitar contas antes de consultar serviços externos', async () => {
  vi.stubEnv('DURAVERSO_MODE', 'connected');
  await expect(register()).rejects.toThrow('somente DURAVERSO_MODE=preview');
  expect(mocks.preflight).not.toHaveBeenCalled();
});
