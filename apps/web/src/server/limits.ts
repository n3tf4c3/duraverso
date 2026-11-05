import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { createHash } from 'node:crypto';
import { readServerEnv } from '@/lib/env';
import { ServiceError } from './errors';

export async function enforceLimit(bucket: 'write' | 'auth', identifier: string) {
  const env = readServerEnv();
  if (env.DURAVERSO_MODE !== 'connected' || !env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) throw new ServiceError(503, 'Proteção de acesso indisponível.');
  const redis = new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN, retry: false });
  const limiter = new Ratelimit({ redis, limiter: Ratelimit.fixedWindow(bucket === 'auth' ? 60 : 30, '1 m'),
    prefix: `duraverso:${bucket}`, analytics: false, ephemeralCache: false, timeout: 3000 });
  try {
    const result = await limiter.limit(createHash('sha256').update(identifier).digest('hex'));
    // O SDK permite em timeout por padrão; o Duraverso recusa explicitamente.
    if (result.reason === 'timeout') { void result.pending.catch(() => {}); throw new ServiceError(503, 'Proteção de acesso indisponível. Tente novamente.'); }
    await result.pending;
    if (!result.success) throw new ServiceError(429, 'Muitas tentativas. Aguarde um minuto antes de tentar novamente.');
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    throw new ServiceError(503, 'Proteção de acesso indisponível. Tente novamente.');
  }
}
