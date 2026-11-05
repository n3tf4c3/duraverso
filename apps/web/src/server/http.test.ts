import { describe, it, expect, vi } from 'vitest';
import { mutation, type MutationDependencies } from './http';
import { ServiceError } from './errors';
import type { Actor } from '@duraverso/core';
const actor: Actor = { id: '00000000-0000-4000-8000-000000000001', sessionVersion: 0, role: 'member', displayName: 'Proprietário' };
function fixture(overrides: Partial<MutationDependencies> = {}) {
  const operation = vi.fn(async () => ({ message: 'Recebido.' })); const limit = vi.fn(async () => {});
  const handler = mutation({ enabled: () => true, origin: () => 'https://duraverso.example', actor: async () => actor, limit, ...overrides }, operation);
  return { handler, operation, limit };
}
function request(body = '{}', origin: string | null = 'https://duraverso.example', contentType = 'application/json') {
  return new Request('https://duraverso.example/api/v1/reviews', { method: 'POST', body, headers: { ...(origin ? { Origin: origin } : {}), 'Content-Type': contentType } });
}
describe('fronteira de escrita', () => {
  it('não grava na prévia nem chama o limitador externo', async () => {
    const f = fixture({ enabled: () => false }); expect((await f.handler(request())).status).toBe(503); expect(f.operation).not.toHaveBeenCalled(); expect(f.limit).not.toHaveBeenCalled();
  });
  it.each([null, 'https://evil.example', 'https://duraverso.example.evil.example'])('recusa origem ausente ou diferente: %s', async (origin) => {
    const f = fixture(); expect((await f.handler(request('{}', origin))).status).toBe(403); expect(f.operation).not.toHaveBeenCalled();
  });
  it('exige sessão e ignora identidade informada pelo cliente', async () => {
    const unauth = fixture({ actor: async () => null }); expect((await unauth.handler(request('{"role":"admin"}'))).status).toBe(401); expect(unauth.operation).not.toHaveBeenCalled();
    const auth = fixture(); await auth.handler(request('{"id":"other","role":"admin"}')); expect(auth.operation).toHaveBeenCalledWith(actor, { id: 'other', role: 'admin' });
  });
  it('falha fechada em indisponibilidade e excesso de tentativas', async () => {
    for (const status of [503, 429]) {
      const f = fixture({ limit: async () => { throw new ServiceError(status, 'Aguarde.'); } }); const response = await f.handler(request());
      expect(response.status).toBe(status); expect(f.operation).not.toHaveBeenCalled(); if (status === 429) expect(response.headers.get('retry-after')).toBe('60');
    }
  });
  it('limita o corpo real e recusa JSON malformado ou tipo incorreto', async () => {
    const f = fixture();
    expect((await f.handler(request('x'.repeat(16385)))).status).toBe(413);
    expect((await f.handler(request('{'))).status).toBe(400);
    expect((await f.handler(request('{}', 'https://duraverso.example', 'text/plain'))).status).toBe(415);
    expect(f.operation).not.toHaveBeenCalled();
  });
  it('retorna no-store e não revela erro de infraestrutura', async () => {
    const f = fixture(); const response = await f.handler(request()); expect(response.status).toBe(200); expect(response.headers.get('cache-control')).toBe('no-store');
    f.operation.mockRejectedValueOnce(new Error('password=not-a-real-secret'));
    const failure = await f.handler(request()); expect(failure.status).toBe(503); expect(await failure.text()).not.toContain('password');
  });
});
