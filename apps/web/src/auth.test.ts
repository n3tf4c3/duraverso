import { beforeEach, expect, it, vi } from 'vitest';
import type { NextAuthConfig } from 'next-auth';
const mocks = vi.hoisted(() => ({ config: undefined as undefined | (() => NextAuthConfig), google: vi.fn(), session: vi.fn(), limit: vi.fn() }));
vi.mock('next-auth', () => ({ default: (config: () => NextAuthConfig) => { mocks.config = config; return { handlers: {}, auth: vi.fn() }; } }));
vi.mock('@/lib/env', () => ({ isConnected: () => true, readServerEnv: () => ({ DURAVERSO_MODE: 'connected', APP_ORIGIN: 'https://duraverso.example', AUTH_GOOGLE_ID: 'test', AUTH_GOOGLE_SECRET: 'test', AUTH_SECRET: 'x'.repeat(32) }) }));
vi.mock('@/server/database', () => ({ database: () => ({}) }));
vi.mock('@/server/limits', () => ({ enforceLimit: mocks.limit }));
vi.mock('@/server/accounts', async (importOriginal) => ({ ...await importOriginal<typeof import('@/server/accounts')>(), accountForGoogle: mocks.google, accountForSession: mocks.session }));
import './auth';
const actor = { id: '00000000-0000-4000-8000-000000000001', sessionVersion: 0, displayName: 'Proprietário', role: 'member' };
beforeEach(() => { vi.clearAllMocks(); mocks.google.mockResolvedValue(actor); mocks.session.mockResolvedValue(actor); mocks.limit.mockResolvedValue(undefined); });
it('OAuth usa somente perfil Google verificado e não guarda dados do provedor no token', async () => {
  const callbacks = mocks.config!().callbacks!;
  const account = { provider: 'google', type: 'oidc' as const, providerAccountId: 'test-subject', access_token: 'synthetic-secret' };
  const user = { id: 'test-subject', name: 'Nome privado', email: 'test@example.invalid', image: 'https://example.invalid/photo' };
  const profile = { sub: 'test-subject', email_verified: true, email: 'test@example.invalid', name: 'Nome privado', role: 'admin' };
  expect(await callbacks.signIn!({ account, user, profile })).toBe(true);
  expect(await callbacks.signIn!({ account, user, profile: { ...profile, email_verified: false } })).toBe(false);
  expect(await callbacks.signIn!({ account: { ...account, provider: 'untrusted' }, user, profile })).toBe(false);
  const token = await callbacks.jwt!({ token: { email: user.email, picture: user.image }, account, user, profile, trigger: 'signIn' });
  expect(token).toEqual({ sub: actor.id, version: 0, name: 'Proprietário', role: 'member' });
  expect(mocks.google).toHaveBeenCalledWith({}, { sub: 'test-subject', email_verified: true });
});
it('revalida sessão no banco e invalida token revogado', async () => {
  const jwt = mocks.config!().callbacks!.jwt!;
  mocks.session.mockResolvedValueOnce(null);
  expect(await jwt({ token: { sub: actor.id, version: 0 }, user: { id: actor.id }, account: null })).toBeNull();
  expect(mocks.session).toHaveBeenCalledWith({}, actor.id, 0);
});
it('redireciona somente para a origem configurada', async () => {
  const redirect = mocks.config!().callbacks!.redirect!;
  expect(await redirect({ url: 'https://evil.example/conta', baseUrl: 'https://evil.example' })).toBe('https://duraverso.example/conta');
  expect(await redirect({ url: '/avaliar/test', baseUrl: 'https://evil.example' })).toBe('https://duraverso.example/avaliar/test');
});
