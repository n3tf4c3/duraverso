# Duraverso

Experiências de uso de produtos, por versão.

Base web do catálogo comunitário de lavadoras, geladeiras, micro-ondas e fogões. A prévia pode ser hospedada
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

## Interface e idiomas

O visual segue a direção “Arquivo de uso”: busca, índice por marca, filtro de categoria, lista de modelos,
fichas com fontes e estados explícitos de conferência. Fotos só entram quando houver
uma imagem licenciada do modelo. As contagens da interface vêm do catálogo.

A prévia pública está disponível em português (URLs originais), inglês (`/en`) e
espanhol (`/es`). O seletor com bandeiras preserva caminho, busca, filtros e seção;
guarda a preferência no cookie `duraverso_locale` por até um ano. Idioma não altera
o mercado brasileiro nem traduz referências de produtos ou relatos de usuários.
Dicionários: `apps/web/src/messages`. A interface operacional do piloto conectado
(administração, avaliação e conta autenticada) permanece em português.

As páginas públicas ficam em `app/[locale]`; os fluxos privados em `app/(operations)`.
O `proxy.ts` compõe idioma e CSP: detalhes, conta, avaliação e administração mantêm
nonce por requisição. APIs permanecem em `/api`, sem prefixo de idioma.
Após mover rotas, iniciar `pnpm web` uma vez regenera também os tipos de desenvolvimento
do Next, evitando referências antigas em `.next/dev/types` durante o build.

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

Com `pnpm web:start` rodando, `node apps/web/scripts/smoke-preview.mjs` verifica por
HTTP as páginas nos três idiomas, filtros, todos os códigos documentados, conta
desativada, preferência de idioma e nonce correspondente no HTML. Esse teste não
substitui a revisão visual e a leitura com câmera real.

A CI está preparada para repetir esses comandos. A integração exige Docker e cria seu
próprio PostgreSQL descartável, sem credenciais externas nem volumes do host. Não implica publicação.
No modo preview, o fluxo inicial tem consulta a 26 candidatos: 20 lavadoras, duas geladeiras,
dois micro-ondas e dois fogões, com filtros, detalhes e leitura de código. As novas fontes
oficiais estão em `apps/web/src/lib/catalog-appliances.ts`; esses seis modelos podem ser
encontrados pelo nome, mas ainda não possuem GTINs ou variantes documentadas no catálogo.
O filtro `category` aceita `washing_machine`, `refrigerator`, `microwave` e `stove` na
API e nas páginas. O filtro de capacidade em kg vale somente para lavadoras; geladeiras
e micro-ondas mostram litros nominais, e fogões mostram o número de bocas.
A busca reconhece 40 GTINs oficiais dos 20
modelos Brastemp, Consul e Electrolux; a cobertura de versões continua parcial. Códigos identificam o modelo, sem selecionar
voltagem nem criar variantes para avaliações. Evidências em `apps/web/src/lib/catalog-evidence.ts`.
Por padrão, contas e administração apresentam seu estado de preparação sem simular gravação.

`pnpm catalog:plan` confere localmente o lote preparado de 20 lavadoras e 40 associações
entre GTIN, identificador do fabricante e tensão nominal. `pnpm catalog:plan --json`
exibe os dados e suas fontes para revisão. `pnpm catalog:plan --all` inclui as quatro
categorias e retorna código não zero enquanto houver modelos sem variantes documentadas.
O comando não acessa banco, não grava dados
nem habilita avaliações. Evidências separadas em `apps/web/src/lib/catalog-variants.ts`;
a busca pública continua retornando somente o modelo.

O importador `pnpm catalog:import` compara esse plano com um PostgreSQL autorizado e
somente lê por padrão. A gravação explícita insere modelos, variantes, GTINs e evidências
em uma transação, preservando registros existentes e mantendo novos itens não verificados.
Exige as migrations até 0005 e conexão direta. Consulte os argumentos e limites em
`docs/operacao-local.md` antes de usar um banco permanente.

O modo conectado tem envio, atualização, retirada e revisão de avaliações; a configuração
externa e o login real ainda não foram executados. Veja `docs/operacao-local.md`.

No modo conectado, páginas e API consultam o catálogo persistente: somente produtos
verificados são públicos, e códigos de variantes não verificadas ficam ocultos. Importar
não publica os itens. Uma falha do banco retorna indisponibilidade, sem usar candidatos
locais como substituição. A prévia continua independente do banco e com o contrato anterior.

A revisão do catálogo está preparada em `/admin/catalogo`, exclusiva de administradores
no modo conectado. Permite liberar/suspender modelos e variantes com motivo, conferência
das evidências e histórico atômico. Exige a migration 0004; não cria administrador nem
infere revisões físicas. Telas desatualizadas são recusadas. Fluxo autenticado real ainda pendente.

## Dados e privacidade

Os modelos vêm de fontes de fabricantes, registradas no catálogo. Ilustrações são genéricas.
Não há notas artificiais, avaliações importadas, rastreadores, imagens remotas ou APIs pagas.
Login Google e operações persistentes estão implementados, com sessões revogáveis,
controle de origem, papéis consultados no banco e limitação compartilhada de acesso.
As migrations foram aplicadas e verificadas somente no PostgreSQL descartável de testes.
Não há banco permanente ou usuário administrador criado.

Não colocar credenciais no Git. `.env.example` contém somente nomes e valores vazios de exemplo.
As decisões e notas de continuidade estão no ai-memory, escopo de `.ai-memory.toml`.
