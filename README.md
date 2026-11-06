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
No modo preview, o fluxo inicial tem consulta a 20 candidatos, filtros, detalhes e leitura de código.
As fontes dos 20 modelos foram conferidas. A busca reconhece 40 GTINs oficiais dos 20
modelos Brastemp, Consul e Electrolux; a cobertura de versões continua parcial. Códigos identificam o modelo, sem selecionar
voltagem nem criar variantes para avaliações. Evidências em `apps/web/src/lib/catalog-evidence.ts`.
Por padrão, contas e administração apresentam seu estado de preparação sem simular gravação.

`pnpm catalog:plan` confere localmente a preparação dos 20 modelos e 40 associações
entre GTIN, identificador do fabricante e tensão nominal. `pnpm catalog:plan --json`
exibe os dados e suas fontes para revisão. O comando não acessa banco, não grava dados
nem habilita avaliações. Evidências separadas em `apps/web/src/lib/catalog-variants.ts`;
a busca pública continua retornando somente o modelo.

O importador `pnpm catalog:import` compara esse plano com um PostgreSQL autorizado e
somente lê por padrão. A gravação explícita insere modelos, variantes, GTINs e evidências
em uma transação, preservando registros existentes e mantendo novos itens não verificados.
Exige a migration 0003 e conexão direta. Consulte os argumentos e limites em
`docs/operacao-local.md` antes de usar um banco permanente.

O modo conectado tem envio, atualização, retirada e revisão de avaliações; a configuração
externa e o login real ainda não foram executados. Veja `docs/operacao-local.md`.

No modo conectado, páginas e API consultam o catálogo persistente: somente produtos
verificados são públicos, e códigos de variantes não verificadas ficam ocultos. Importar
não publica os itens. Uma falha do banco retorna indisponibilidade, sem usar candidatos
locais como substituição. A prévia continua independente do banco e com o contrato anterior.

## Dados e privacidade

Os modelos vêm de fontes de fabricantes, registradas no catálogo. Ilustrações são genéricas.
Não há notas artificiais, avaliações importadas, rastreadores, imagens remotas ou APIs pagas.
Login Google e operações persistentes estão implementados, com sessões revogáveis,
controle de origem, papéis consultados no banco e limitação compartilhada de acesso.
As migrations foram aplicadas e verificadas somente no PostgreSQL descartável de testes.
Não há banco permanente ou usuário administrador criado.

Não colocar credenciais no Git. `.env.example` contém somente nomes e valores vazios de exemplo.
As decisões e notas de continuidade estão no ai-memory, escopo de `.ai-memory.toml`.
