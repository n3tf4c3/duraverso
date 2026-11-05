import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ limit: vi.fn() }));
vi.mock('@upstash/redis', () => ({ Redis: class {} }));
vi.mock('@upstash/ratelimit', () => ({ Ratelimit: class { static fixedWindow() { return {}; } limit = mocks.limit; } }));
vi.mock('@/lib/env', () => ({ readServerEnv: () => ({ DURAVERSO_MODE: 'connected', UPSTASH_REDIS_REST_URL: 'https://example.invalid', UPSTASH_REDIS_REST_TOKEN: 'synthetic' }) }));
import { enforceLimit } from './limits';
beforeEach(() => mocks.limit.mockReset());
describe('limitador compartilhado', () => {
  it('recusa timeout mesmo quando o SDK permite por padrão', async () => {
    mocks.limit.mockResolvedValue({ success: true, reason: 'timeout', pending: Promise.resolve() });
    await expect(enforceLimit('write', 'test-subject')).rejects.toMatchObject({ status: 503 });
  });
  it('recusa indisponibilidade, cota e falha da persistência', async () => {
    mocks.limit.mockRejectedValueOnce(new Error('unavailable'));
    await expect(enforceLimit('write', 'test-subject')).rejects.toMatchObject({ status: 503 });
    mocks.limit.mockResolvedValueOnce({ success: false, pending: Promise.resolve() });
    await expect(enforceLimit('write', 'test-subject')).rejects.toMatchObject({ status: 429 });
    mocks.limit.mockResolvedValueOnce({ success: true, pending: Promise.reject(new Error('unavailable')) });
    await expect(enforceLimit('write', 'test-subject')).rejects.toMatchObject({ status: 503 });
  });
  it('permite confirmação persistida e não usa identificador pessoal na chave', async () => {
    mocks.limit.mockResolvedValue({ success: true, pending: Promise.resolve() }); await enforceLimit('write', 'test-subject');
    expect(mocks.limit.mock.calls[0]?.[0]).toMatch(/^[a-f0-9]{64}$/); expect(mocks.limit.mock.calls[0]?.[0]).not.toContain('test-subject');
  });
});
