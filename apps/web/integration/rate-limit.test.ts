import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Pool } from 'pg';
import { createHash, randomUUID } from 'node:crypto';

const address = new URL(process.env.TEST_DATABASE_URL ?? 'http://invalid');
if (
  address.hostname !== '127.0.0.1' ||
  !address.port ||
  address.pathname !== '/duraverso_test' ||
  !process.env.TEST_RUN_ID
)
  throw new Error('Execute pelo runner: somente banco descartável marcado.');
const pool = new Pool({ connectionString: address.href, max: 8, application_name: 'duraverso-tests' });
beforeAll(async () => {
  const marker = await pool.query('SELECT run_id FROM duraverso_test_guard.marker');
  expect(marker.rows).toEqual([{ run_id: process.env.TEST_RUN_ID }]);
});
afterAll(async () => {
  await pool.end();
});
const key = () => createHash('sha256').update(randomUUID()).digest('hex');
const hit = async (bucket: string, hash: string, max: number) =>
  (await pool.query<{ allowed: boolean }>('SELECT duraverso_rate_limit($1,$2,$3) AS allowed', [bucket, hash, max]))
    .rows[0]!.allowed;

describe.sequential('limitador no PostgreSQL', () => {
  it('chamadas concorrentes nunca passam do limite da janela', async () => {
    const hash = key();
    // Evita a virada do minuto no meio do teste, que abriria uma janela nova.
    const second = new Date().getUTCSeconds();
    if (second > 50) await new Promise((resolve) => setTimeout(resolve, (61 - second) * 1000));
    const results = await Promise.all(Array.from({ length: 40 }, () => hit('write', hash, 30)));
    expect(results.filter(Boolean)).toHaveLength(30);
    expect(results.filter((allowed) => !allowed)).toHaveLength(10);
    const rows = await pool.query('SELECT hits FROM rate_limits WHERE key_hash=$1', [hash]);
    expect(rows.rows).toEqual([{ hits: 40 }]);
  }, 20000);
  it('baldes e chaves diferentes não compartilham contagem', async () => {
    const hash = key();
    expect(await hit('write', hash, 1)).toBe(true);
    expect(await hit('write', hash, 1)).toBe(false);
    expect(await hit('auth', hash, 1)).toBe(true);
    expect(await hit('write', key(), 1)).toBe(true);
  });
  it.each([
    ['balde desconhecido', 'other', key(), 30],
    ['chave sem hash', 'write', 'subject:google-123', 30],
    ['limite inválido', 'write', key(), 0],
  ])('recusa %s', async (_label, bucket, hash, max) => {
    await expect(hit(bucket as string, hash as string, max as number)).rejects.toMatchObject({
      message: 'rate_limit_invalid',
    });
  });
});
