import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { readServerEnv } from '../lib/env';
import * as schema from './schema';
export function createDatabase() {
  const { DATABASE_URL } = readServerEnv();
  if (!DATABASE_URL) throw new Error('Banco não configurado. Esta base funciona somente com o catálogo local.');
  return drizzle(neon(DATABASE_URL), { schema });
}
