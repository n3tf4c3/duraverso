import { config } from 'dotenv';
import { Client } from 'pg';
import { fileURLToPath } from 'node:url';
import { catalogPlan } from '../lib/catalog-plan';
import { catalogImportOptions, catalogImportTarget } from './catalog-import-options';
import { importCatalog } from './catalog-importer';

async function main() {
  const options = catalogImportOptions(process.argv.slice(2));
  config({ path: fileURLToPath(new URL('../../.env.local', import.meta.url)), quiet: true });
  if (process.env.VERCEL) throw new Error('Importação é operação administrativa fora da hospedagem.');
  const connectionString = process.env.DATABASE_URL_DIRECT;
  const target = catalogImportTarget(connectionString, options.expectedTarget);
  const plan = catalogPlan();
  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 10000,
    application_name: 'duraverso-catalog-import',
  });
  try {
    await client.connect();
    const report = await importCatalog(client, plan.products, plan.variants, options.apply);
    console.log(JSON.stringify({ target, ...report }, null, 2));
    if (report.conflicts.length) process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main().catch(() => {
  console.error(
    'Importação não concluída. Confira o banco autorizado, as migrations e os argumentos. Use catalog:import para conferir; para gravar, --apply --expect-target=host:porta/banco. Detalhes de conexão não são exibidos.',
  );
  process.exitCode = 1;
});
