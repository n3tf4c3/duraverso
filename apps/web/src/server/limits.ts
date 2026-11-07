import { createHash } from 'node:crypto';
import { readServerEnv } from '@/lib/env';
import { database } from './database';
import { ServiceError } from './errors';

/** Requisições por minuto em cada balde; a contagem fica no PostgreSQL do modo conectado. */
export const rateLimits = { write: 30, auth: 60 } as const;

export async function enforceLimit(bucket: keyof typeof rateLimits, identifier: string) {
  let allowed: unknown;
  try {
    if (readServerEnv().DURAVERSO_MODE !== 'connected') throw new Error('disabled');
    // A chave é um hash: o banco não guarda identificador de conta, subject Google ou IP.
    const key = createHash('sha256').update(identifier).digest('hex');
    const rows = await database().query<{ allowed: boolean }>(
      'SELECT duraverso_rate_limit($1,$2,$3::integer) AS allowed',
      [bucket, key, rateLimits[bucket]],
    );
    allowed = rows[0]?.allowed;
  } catch {
    // Falha, timeout ou função ausente recusam a ação; o limitador nunca libera por omissão.
    throw new ServiceError(503, 'Proteção de acesso indisponível. Tente novamente.');
  }
  if (allowed === false) throw new ServiceError(429, 'Muitas tentativas. Aguarde um minuto antes de tentar novamente.');
  if (allowed !== true) throw new ServiceError(503, 'Proteção de acesso indisponível. Tente novamente.');
}
