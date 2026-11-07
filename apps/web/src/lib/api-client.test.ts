import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
vi.mock('next/navigation', () => ({ usePathname: () => '/avaliar/consul-cwh13ab', useRouter: () => ({}) }));
vi.mock('next-auth/react', () => ({ signIn: vi.fn(), signOut: vi.fn() }));
import { ApiError, needsLogin, postJson } from './api-client';
import { SessionExpired } from '@/components/account-actions';

function respond(status: number, body: string) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(body, { status, headers: { 'Content-Type': 'application/json' } })),
  );
}
afterEach(() => vi.unstubAllGlobals());

describe('cliente das rotas de escrita (achado #2)', () => {
  it('preserva o status 401 e pede novo login', async () => {
    respond(401, JSON.stringify({ error: 'Entre com Google para continuar.' }));
    const error = await postJson('/api/v1/reviews', {}).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 401, message: 'Entre com Google para continuar.' });
    expect(needsLogin(error)).toBe(true);
  });
  it.each([403, 409, 429, 503])('status %i mantém a sessão e mostra a mensagem do servidor', async (status) => {
    respond(status, JSON.stringify({ error: 'Mensagem do servidor.' }));
    const error = await postJson('/api/v1/reviews', {}).catch((caught: unknown) => caught);
    expect(error).toMatchObject({ status, message: 'Mensagem do servidor.' });
    expect(needsLogin(error)).toBe(false);
  });
  it('resposta sem JSON não esconde o status', async () => {
    respond(401, '<html>erro</html>');
    const error = await postJson('/api/v1/reviews', {}).catch((caught: unknown) => caught);
    expect(error).toMatchObject({ status: 401, message: 'Não foi possível concluir. Tente novamente.' });
  });
  it('falha de rede não é tratada como sessão encerrada', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );
    const error = await postJson('/api/v1/reviews', {}).catch((caught: unknown) => caught);
    expect(needsLogin(error)).toBe(false);
  });
  it('sucesso devolve a mensagem do servidor', async () => {
    respond(200, JSON.stringify({ message: 'Avaliação enviada para revisão.' }));
    await expect(postJson('/api/v1/reviews', {})).resolves.toBe('Avaliação enviada para revisão.');
  });
  it('o aviso de sessão encerrada oferece login de volta à mesma página', () => {
    const html = renderToStaticMarkup(createElement(SessionExpired));
    expect(html).toContain('Sua sessão terminou');
    expect(html).toContain('Entrar com Google');
    expect(html).toContain('role="alert"');
  });
});
