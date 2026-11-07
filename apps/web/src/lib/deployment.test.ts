import { expect, it } from 'vitest';
import { assertDeploymentMode } from './deployment';

const pilot = { DURAVERSO_MODE: 'connected', DURAVERSO_CONNECTED_HOST: 'vercel-pilot' };
it.each(['production', 'preview', 'development'])(
  'permite catálogo sem credenciais no ambiente Vercel %s',
  (VERCEL_ENV) => {
    expect(() => assertDeploymentMode({ VERCEL_ENV, DURAVERSO_MODE: 'preview' })).not.toThrow();
    expect(() => assertDeploymentMode({ VERCEL_ENV })).not.toThrow();
  },
);
it.each(['production', 'preview', 'development'])(
  'recusa modo conectado sem marcação do piloto, ou modo desconhecido, no ambiente Vercel %s',
  (VERCEL_ENV) => {
    expect(() => assertDeploymentMode({ VERCEL_ENV, DURAVERSO_MODE: 'connected' })).toThrow('projeto do piloto');
    expect(() => assertDeploymentMode({ VERCEL_ENV, DURAVERSO_MODE: 'invalid' })).toThrow('projeto do piloto');
    expect(() =>
      assertDeploymentMode({ VERCEL_ENV, DURAVERSO_MODE: 'connected', DURAVERSO_CONNECTED_HOST: 'outro' }),
    ).toThrow('projeto do piloto');
  },
);
it('libera o modo conectado somente na produção do projeto do piloto', () => {
  expect(() => assertDeploymentMode({ VERCEL_ENV: 'production', ...pilot })).not.toThrow();
  expect(() => assertDeploymentMode({ VERCEL_ENV: 'preview', ...pilot })).toThrow('projeto do piloto');
  expect(() => assertDeploymentMode({ VERCEL_ENV: 'development', ...pilot })).toThrow('projeto do piloto');
  expect(() => assertDeploymentMode({ VERCEL: '1', ...pilot })).toThrow('projeto do piloto');
});
it('também protege a Vercel sem VERCEL_ENV e preserva o ambiente local', () => {
  expect(() => assertDeploymentMode({ VERCEL: '1', DURAVERSO_MODE: 'connected' })).toThrow();
  expect(() => assertDeploymentMode({ DURAVERSO_MODE: 'connected' })).not.toThrow();
});
