import { expect, it } from 'vitest';
import { serverEnvSchema } from './env';
it('permite prévia sem credenciais e recusa pares incompletos ou segredo curto', () => {
  expect(serverEnvSchema.safeParse({}).success).toBe(true);
  expect(serverEnvSchema.safeParse({ AUTH_GOOGLE_ID: 'id' }).success).toBe(false);
  expect(serverEnvSchema.safeParse({ AUTH_SECRET: 'curto' }).success).toBe(false);
});
it('modo conectado exige todos os recursos e origem exata', () => {
  expect(serverEnvSchema.safeParse({ DURAVERSO_MODE: 'connected' }).success).toBe(false);
  const valid = {
    DURAVERSO_MODE: 'connected',
    DATABASE_URL: 'postgresql://test@db.invalid/test',
    AUTH_SECRET: 'x'.repeat(32),
    AUTH_GOOGLE_ID: 'synthetic',
    AUTH_GOOGLE_SECRET: 'synthetic',
    APP_ORIGIN: 'http://localhost:3107',
    AUTH_URL: 'http://localhost:3107',
  };
  expect(serverEnvSchema.safeParse(valid).success).toBe(true);
  expect(serverEnvSchema.safeParse({ ...valid, AUTH_URL: 'https://other.invalid' }).success).toBe(false);
  expect(
    serverEnvSchema.safeParse({ ...valid, APP_ORIGIN: 'http://remote.invalid', AUTH_URL: 'http://remote.invalid' })
      .success,
  ).toBe(false);
  expect(serverEnvSchema.safeParse({ ...valid, DURAVERSO_CONNECTED_HOST: 'other' }).success).toBe(false);
  expect(serverEnvSchema.safeParse({ ...valid, APP_ORIGIN: 'invalid' }).success).toBe(false);
});
