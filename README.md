# Duraverso

Experiências de uso de produtos, por versão.

Base web do catálogo comunitário de eletrodomésticos de cozinha, lavanderia, limpeza e climatização.
Em https://duraverso.vercel.app roda o piloto fechado, com login Google por convite e catálogo
vindo do banco. Localmente e nos deploys de preview, o modo prévia funciona sem banco nem contas.

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

O site está disponível em português (URLs originais), inglês (`/en`) e
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

## Vercel

Um único projeto, `duraverso`: Root Directory `apps/web`, preset Next.js, Node 24.x, build
`pnpm run build`, instalação `pnpm install --frozen-lockfile`, saída padrão.
Production roda `connected` com `DURAVERSO_CONNECTED_HOST=vercel-pilot`, banco Neon e
credenciais Google. Preview e Development ficam em `DURAVERSO_MODE=preview`, sem banco nem
segredos. Build e inicialização recusam qualquer outra combinação. Veja `docs/operacao-local.md`.

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
No modo preview, a consulta reúne 259 candidatos de 19 marcas em 13 categorias:
20 lavadoras, sete geladeiras, sete micro-ondas, sete fogões, cinco freezers, cinco fornos,
cinco cooktops, cinco lava-louças, dez air fryers, seis liquidificadores, oito aspiradores
e seis cafeteiras, além de 168 aparelhos de ar-condicionado (Consul, Electrolux, Midea,
LG, Samsung, Gree, Daikin, Fujitsu, Carrier, Springer Midea, Elgin, TCL, Hisense,
Philco e Agratto). Fontes oficiais e datas em `apps/web/src/lib/catalog-appliances.ts`,
`catalog-large-appliances.ts`, `catalog-small-appliances.ts`,
`catalog-air-conditioning-existing.ts`, `catalog-air-conditioning-new.ts`,
`catalog-air-conditioning-daikin.ts`, `catalog-air-conditioning-fujitsu.ts`,
`catalog-air-conditioning-carrier-elgin.ts` e `catalog-air-conditioning-additional.ts`. Os 239 modelos além das
lavadoras ainda não possuem GTINs ou variantes documentadas; são encontrados pelo nome.
Daikin usa pares explícitos do histórico oficial Inmetro; Fujitsu usa os catálogos
do fabricante no portal GENERAL. Referências históricas não comprovam certificação
vigente nem disponibilidade comercial.
O filtro `category` aceita as chaves canônicas de `productCategories` no core, tanto na
API quanto nas páginas. A home mostra uma amostra por marca, com acesso à lista completa.
O filtro em kg vale somente para lavadoras. As demais fichas distinguem litros nominais,
bocas, serviços, watts elétricos e capacidade de refrigeração em BTU/h; esses valores
não são comparáveis entre categorias. Ar-condicionado aceita busca por capacidade,
como `12000 BTU`, `12.000 BTU/h` e `12,000 BTU/h`.
Medidas não documentadas ficam “a confirmar”. Não converter xícaras em litros.
A busca reconhece 40 GTINs oficiais dos 20
modelos Brastemp, Consul e Electrolux; a cobertura de versões continua parcial. Códigos identificam o modelo, sem selecionar
voltagem nem criar variantes para avaliações. Evidências em `apps/web/src/lib/catalog-evidence.ts`.
Por padrão, contas e administração apresentam seu estado de preparação sem simular gravação.

`pnpm catalog:plan` confere localmente o lote preparado de 20 lavadoras e 40 associações
entre GTIN, identificador do fabricante e tensão nominal. `pnpm catalog:plan --json`
exibe os dados e suas fontes para revisão. `pnpm catalog:plan --all` inclui todas as
categorias e retorna código não zero enquanto houver modelos sem variantes documentadas.
O comando não acessa banco, não grava dados
nem habilita avaliações. Evidências separadas em `apps/web/src/lib/catalog-variants.ts`;
a busca pública continua retornando somente o modelo.

O importador `pnpm catalog:import` compara esse plano com um PostgreSQL autorizado e
somente lê por padrão. A gravação explícita insere modelos, variantes, GTINs e evidências
em uma transação, preservando registros existentes e mantendo novos itens não verificados.
Exige as migrations até 0009 e conexão direta. Consulte os argumentos e limites em
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
