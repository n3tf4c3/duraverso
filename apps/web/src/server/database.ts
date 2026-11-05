import { neon } from '@neondatabase/serverless';
import { readServerEnv } from '@/lib/env';

export interface Database {
  query<T extends Record<string, unknown>>(text: string, values?: unknown[]): Promise<T[]>;
}
export function database(): Database {
  const env = readServerEnv();
  if (env.DURAVERSO_MODE !== 'connected' || !env.DATABASE_URL) throw new Error('Serviço não configurado.');
  const sql = neon(env.DATABASE_URL);
  return { async query<T extends Record<string, unknown>>(text: string, values: unknown[] = []) {
    return await sql.query(text, values, { fullResults: false, fetchOptions: { signal: AbortSignal.timeout(10000), cache: 'no-store' } }) as T[];
  } };
}
