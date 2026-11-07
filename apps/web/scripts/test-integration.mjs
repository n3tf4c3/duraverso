import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
const require = createRequire(import.meta.url);
const runId = randomUUID();
const name = `duraverso-test-${runId}`;
const image = 'postgres@sha256:266d3c257594e195b309ae9d1805e54c788f1d7b375f56bf6c367aac6c917e7b';
let container;
function docker(args, input) {
  const result = spawnSync('docker', args, { input, encoding: 'utf8', timeout: 90000, windowsHide: true });
  if (result.error || result.status !== 0)
    throw new Error(`Docker: ${result.stderr || result.error?.message || 'falha'}`);
  return result.stdout.trim();
}
function psql(input) {
  return docker(
    ['exec', '-i', container, 'psql', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', 'duraverso_test'],
    input,
  );
}
function test(args, env) {
  return spawnSync(
    process.execPath,
    [
      join(dirname(require.resolve('vitest/package.json')), 'vitest.mjs'),
      'run',
      '--config',
      'vitest.integration.config.ts',
      ...args,
    ],
    { stdio: 'inherit', env, windowsHide: true, timeout: 120000 },
  );
}
try {
  container = docker([
    'run',
    '--detach',
    '--rm',
    '--name',
    name,
    '--label',
    `duraverso.testRun=${runId}`,
    '--tmpfs',
    '/var/lib/postgresql/data',
    '-e',
    'POSTGRES_PASSWORD=test-only',
    '-e',
    'POSTGRES_DB=duraverso_test',
    '-p',
    '127.0.0.1::5432',
    image,
  ]);
  if (!/^[a-f0-9]{64}$/.test(container)) throw new Error('ID inesperado.');
  const deadline = Date.now() + 30000;
  let ready = false;
  while (Date.now() < deadline) {
    // O bootstrap do Docker aceita conexões pelo socket antes de criar o banco.
    // Uma consulta TCP confirma o servidor definitivo e o banco solicitado.
    const check = spawnSync(
      'docker',
      [
        'exec',
        '-e',
        'PGPASSWORD=test-only',
        container,
        'psql',
        '-h',
        '127.0.0.1',
        '-U',
        'postgres',
        '-d',
        'duraverso_test',
        '-v',
        'ON_ERROR_STOP=1',
        '-Atqc',
        'SELECT 1',
      ],
      { windowsHide: true, stdio: 'ignore', timeout: 5000 },
    );
    if (check.status === 0) {
      ready = true;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (!ready) throw new Error('PostgreSQL de teste não iniciou.');
  const inspect = JSON.parse(docker(['inspect', container]))[0];
  const binding = inspect.NetworkSettings.Ports['5432/tcp'][0];
  if (binding.HostIp !== '127.0.0.1' || !/^\d+$/.test(binding.HostPort))
    throw new Error('Porta de teste não está isolada em loopback.');
  psql(
    `CREATE SCHEMA duraverso_test_guard; CREATE TABLE duraverso_test_guard.marker (run_id uuid PRIMARY KEY); INSERT INTO duraverso_test_guard.marker VALUES ('${runId}');`,
  );
  for (const file of readdirSync('drizzle')
    .filter((f) => f.endsWith('.sql'))
    .sort())
    psql(readFileSync(`drizzle/${file}`, 'utf8'));
  const env = {
    ...process.env,
    TEST_DATABASE_URL: `postgresql://postgres:test-only@127.0.0.1:${binding.HostPort}/duraverso_test`,
    TEST_RUN_ID: runId,
  };
  const result = test([], env);
  if (result.status !== 0) throw new Error('Testes de integração falharam.');
  if (process.argv.includes('--falsify')) {
    const original = readFileSync('drizzle/0002_review-operations.sql', 'utf8');
    const broken = original.replace('AND v.verified AND p.verified', '');
    if (broken === original) throw new Error('Defesa de variantes não localizada.');
    try {
      psql(broken);
      const negative = test(['--testNamePattern', 'recusa variante não verificada'], env);
      if (negative.status !== 1) throw new Error('A falsificação não foi detectada conforme esperado.');
      console.log('Controle negativo: teste recusou a implementação sem a verificação da variante.');
    } finally {
      psql(original);
    }
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (container && /^[a-f0-9]{64}$/.test(container)) {
    const info = JSON.parse(docker(['inspect', container]))[0];
    if (info.Config.Labels?.['duraverso.testRun'] !== runId)
      throw new Error('Recusa de limpeza: contêiner não pertence a este teste.');
    docker(['stop', '--time', '2', container]);
    console.log('PostgreSQL descartável encerrado e removido; nenhum volume do host foi montado.');
  }
}
