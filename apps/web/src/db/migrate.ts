import { config } from 'dotenv';
import { Client } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { fileURLToPath } from 'node:url';
config({ path: '.env.local', quiet: true });

async function main() {
  const value = process.env.DATABASE_URL_DIRECT;
  if (!value) throw new Error('Defina DATABASE_URL_DIRECT de um banco autorizado antes de aplicar migrations.');
  const target = new URL(value);
  if (!['postgres:', 'postgresql:'].includes(target.protocol) || target.hostname.includes('-pooler'))
    throw new Error('A migration exige conexão PostgreSQL direta de sessão, sem pooler.');
  const client = new Client({ connectionString: value, connectionTimeoutMillis: 10000 });
  try {
    await client.connect();
    console.info(`Migration: ${target.hostname}${target.pathname}`);
    await client.query('SELECT pg_advisory_lock($1)', [7340821]);
    try {
      await migrate(drizzle(client), { migrationsFolder: fileURLToPath(new URL('../../drizzle', import.meta.url)) });
    } finally {
      await client.query('SELECT pg_advisory_unlock($1)', [7340821]);
    }
  } finally {
    await client.end();
  }
}
main().catch(() => {
  console.error(
    'Migration não aplicada ou incompleta. Verifique a configuração e o banco autorizado; detalhes de conexão não são exibidos.',
  );
  process.exitCode = 1;
});
