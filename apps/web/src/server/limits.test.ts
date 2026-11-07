import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ query: vi.fn(), mode: 'connected' }));
vi.mock('@/lib/env', () => ({ readServerEnv: () => ({ DURAVERSO_MODE: mocks.mode }) }));
vi.mock('./database', () => ({ database: () => ({ query: mocks.query }) }));
import { enforceLimit, rateLimits } from './limits';
beforeEach(() => {
  mocks.query.mockReset();
  mocks.mode = 'connected';
});
describe('limitador no PostgreSQL', () => {
  it('permite somente com confirmação explícita do banco', async () => {
    mocks.query.mockResolvedValue([{ allowed: true }]);
    await expect(enforceLimit('write', 'test-subject')).resolves.toBeUndefined();
    const [text, values] = mocks.query.mock.calls[0]!;
    expect(text).toContain('duraverso_rate_limit');
    expect(values).toEqual(['write', expect.stringMatching(/^[a-f0-9]{64}$/), rateLimits.write]);
  });
  it('não usa identificador pessoal na chave', async () => {
    mocks.query.mockResolvedValue([{ allowed: true }]);
    await enforceLimit('auth', 'subject:google-123');
    expect(JSON.stringify(mocks.query.mock.calls[0])).not.toContain('google-123');
  });
  it('limite atingido responde 429', async () => {
    mocks.query.mockResolvedValue([{ allowed: false }]);
    await expect(enforceLimit('write', 'test-subject')).rejects.toMatchObject({ status: 429 });
  });
  it.each([
    ['falha do banco', () => mocks.query.mockRejectedValue(new Error('connection to secret-host'))],
    ['resposta vazia', () => mocks.query.mockResolvedValue([])],
    ['resposta fora do contrato', () => mocks.query.mockResolvedValue([{ allowed: 'true' }])],
  ])('%s recusa com 503 sem detalhes', async (_label, arrange) => {
    arrange();
    const error = await enforceLimit('write', 'test-subject').catch((caught: unknown) => caught);
    expect(error).toMatchObject({ status: 503 });
    expect(String((error as Error).message)).not.toContain('secret-host');
  });
  it('fora do modo conectado não consulta o banco e recusa', async () => {
    mocks.mode = 'preview';
    await expect(enforceLimit('write', 'test-subject')).rejects.toMatchObject({ status: 503 });
    expect(mocks.query).not.toHaveBeenCalled();
  });
});
