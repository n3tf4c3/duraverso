# Duraverso

Histórias reais. Escolhas que duram.

Base web do catálogo comunitário de lavadoras. A prévia do catálogo pode ser hospedada
na Vercel, com contas e contribuições desativadas. Nenhum banco é necessário nessa fase.

## Executar localmente

Requer Node na versão de `.nvmrc` e pnpm na versão de `packageManager`.

```sh
pnpm install --frozen-lockfile
pnpm web
```

Abra http://127.0.0.1:3107. O desenvolvimento funciona sem credenciais.
Para testar o build: `pnpm web:build`, depois `pnpm web:start`.
Não executar desenvolvimento e produção na mesma porta ao mesmo tempo.

## Prévia na Vercel

Projeto `duraverso`, Root Directory `apps/web`, preset Next.js, Node 24.x.
Build `pnpm run build`, instalação `pnpm install --frozen-lockfile`, saída padrão.
Defina `DURAVERSO_MODE=preview` e `ENABLE_EXPERIMENTAL_COREPACK=1` em Production e Preview.
Não adicionar Neon/Upstash nem credenciais Google para essa prévia. O modo `connected`
continua bloqueado na Vercel, tanto no build quanto na inicialização.

## Estrutura

- `apps/web`: páginas, scanner, catálogo público, login Google, avaliações e moderação.
- `packages/core`: identificação, validação e regras de avaliações/moderação.
- `docs/operacao-local.md`: operação, limites e preparação externa.

## Validação

```sh
pnpm lint
pnpm web:build
pnpm typecheck
pnpm test
pnpm test:integration
```

A CI está preparada para repetir esses comandos. A integração exige Docker e cria seu
próprio PostgreSQL descartável, sem credenciais externas nem volumes do host. Não implica publicação.
O fluxo inicial tem consulta a 20 candidatos, filtros, detalhes e leitura de código.
GTIN/variantes ainda não conferidos; o scanner não promete encontrar esses códigos.
Por padrão, contas e administração apresentam seu estado de preparação sem simular gravação.
O modo conectado tem envio, atualização, retirada e revisão de avaliações; a configuração
externa e o login real ainda não foram executados. Veja `docs/operacao-local.md`.

## Dados e privacidade

Os modelos vêm de fontes de fabricantes, registradas no catálogo. Ilustrações são genéricas.
Não há notas artificiais, avaliações importadas, rastreadores, imagens remotas ou APIs pagas.
Login Google e operações persistentes estão implementados, com sessões revogáveis,
controle de origem, papéis consultados no banco e limitação compartilhada de acesso.
As migrations foram aplicadas e verificadas somente no PostgreSQL descartável de testes.
Não há banco permanente ou usuário administrador criado.

Não colocar credenciais no Git. `.env.example` contém somente nomes e valores vazios de exemplo.
As decisões e notas de continuidade estão no ai-memory, escopo de `.ai-memory.toml`.
