import { expect, it } from 'vitest';
import { assertDeploymentMode } from './deployment';
it.each(['production', 'preview', 'development'])(
  'permite catálogo sem credenciais no ambiente Vercel %s',
  (VERCEL_ENV) => {
    expect(() => assertDeploymentMode({ VERCEL_ENV, DURAVERSO_MODE: 'preview' })).not.toThrow();
    expect(() => assertDeploymentMode({ VERCEL_ENV })).not.toThrow();
  },
);
it.each(['production', 'preview', 'development'])(
  'recusa modo conectado ou desconhecido no ambiente Vercel %s',
  (VERCEL_ENV) => {
    expect(() => assertDeploymentMode({ VERCEL_ENV, DURAVERSO_MODE: 'connected' })).toThrow(
      'somente DURAVERSO_MODE=preview',
    );
    expect(() => assertDeploymentMode({ VERCEL_ENV, DURAVERSO_MODE: 'invalid' })).toThrow(
      'somente DURAVERSO_MODE=preview',
    );
  },
);
it('também protege a Vercel sem VERCEL_ENV e preserva o ambiente local', () => {
  expect(() => assertDeploymentMode({ VERCEL: '1', DURAVERSO_MODE: 'connected' })).toThrow();
  expect(() => assertDeploymentMode({ DURAVERSO_MODE: 'connected' })).not.toThrow();
});
