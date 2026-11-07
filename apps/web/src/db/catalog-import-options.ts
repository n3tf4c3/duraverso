export function catalogImportOptions(args: string[]) {
  let apply = false;
  let expectedTarget: string | undefined;
  for (const arg of args) {
    if (arg === '--apply' && !apply) apply = true;
    else if (arg.startsWith('--expect-target=') && !expectedTarget) {
      expectedTarget = arg.slice('--expect-target='.length);
      if (!expectedTarget) throw new Error('Informe o destino esperado.');
    } else throw new Error('Argumentos inválidos.');
  }
  if (apply !== Boolean(expectedTarget)) throw new Error('A gravação exige --apply e --expect-target juntos.');
  return { apply, expectedTarget };
}

export function catalogImportTarget(value: string | undefined, expectedTarget?: string) {
  if (!value || !URL.canParse(value)) throw new Error('Configure uma conexão direta autorizada.');
  const url = new URL(value);
  if (
    !['postgres:', 'postgresql:'].includes(url.protocol) ||
    !url.hostname ||
    url.hostname.includes('-pooler') ||
    !url.pathname ||
    url.pathname === '/' ||
    url.hash
  )
    throw new Error('Exige conexão PostgreSQL direta com banco explícito.');
  // Parâmetros capazes de redirecionar o destino não podem invalidar a confirmação.
  const allowed = new Set([
    'sslmode',
    'sslrootcert',
    'sslcert',
    'sslkey',
    'channel_binding',
    'connect_timeout',
    'application_name',
  ]);
  for (const name of url.searchParams.keys()) {
    if (!allowed.has(name)) throw new Error('Parâmetro de conexão não permitido para esta operação.');
  }
  const target = `${url.hostname}:${url.port || '5432'}${url.pathname}`;
  if (expectedTarget && expectedTarget !== target) throw new Error('O destino não corresponde ao informado.');
  return target;
}
