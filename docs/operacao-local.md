# Operação local e preparação externa

## Escopo da entrega

Esta é a base local, não o piloto público completo. Em preview, catálogo e API usam
259 modelos candidatos embutidos em 13 categorias e 19 marcas. Os 40 GTINs
documentados continuam associados somente às 20 lavadoras.
No modo conectado, avaliações, contas e revisão manual usam persistência real.
Nenhum banco permanente, limitador externo, domínio próprio ou administrador foi criado.

O padrão `DURAVERSO_MODE=preview` funciona sem credenciais e recusa login e todas as
escritas com HTTP 503. Não há login simulado ou atalho de administrador para testes.
O modo `connected` somente inicia após validar configuração, funções SQL e acesso ao
limitador compartilhado. Falhas impedem a abertura das rotas sensíveis.

## Recursos locais

Servidor vinculado apenas a 127.0.0.1:3107. Câmera depende de permissão e navegador.
Permissão negada, dispositivo indisponível ou GTIN desconhecido têm pesquisa manual como alternativa.
Nenhuma captura da câmera é enviada. A biblioteca de leitura só carrega ao solicitar a câmera.

As fontes e evidências estão em `apps/web/src/lib/catalog-evidence.ts`, consumidas pelo
catálogo em `apps/web/src/lib/catalog.ts`. Modelo e capacidade foram conferidos nos 20
candidatos. Os 40 GTINs identificam apenas modelos na consulta pública. A preparação
documental local das variantes está em `catalog-variants.ts`, conferida em 06/11/2026.
Não deduzir tensão pela ordem dos códigos ou por um seletor comercial 110V/127V.
O campo EAN-13 truncado da LED13 foi descartado; os campos individuais fornecem os
códigos completos. Para LDA13, o manual sustenta 13 kg apesar do campo 13,1 kg na loja.
GTIN ausente não impede busca por marca/modelo; nunca adivinhar a correspondência.
As fontes oficiais das outras categorias estão em `catalog-appliances.ts`,
`catalog-large-appliances.ts`, `catalog-small-appliances.ts`,
`catalog-air-conditioning-existing.ts`, `catalog-air-conditioning-new.ts`,
`catalog-air-conditioning-daikin.ts`, `catalog-air-conditioning-fujitsu.ts`,
`catalog-air-conditioning-carrier-elgin.ts` e `catalog-air-conditioning-additional.ts`, com data de conferência,
modelo e medida nominal. Nenhuma tensão, variante ou código novo foi inferido.
As fichas distinguem kg (lavadoras), litros (geladeiras, micro-ondas, freezers, fornos,
air fryers, liquidificadores e cafeteiras), bocas (fogões/cooktops), serviços (lava-louças),
watts elétricos (aspiradores) e capacidade nominal de refrigeração em BTU/h
(ar-condicionado). O mapa canônico é `productMeasurementField` no core.
As marcas são Brastemp, Consul, Electrolux, Midea, Panasonic, Philips Walita, WAP,
LG, Samsung, Gree, Daikin, Fujitsu, Carrier, Springer Midea, Elgin, TCL, Hisense,
Philco e Agratto.
Seis produtos ficam sem medida: HR2270/91 tem divergência na fonte; cinco cafeteiras
informam xícaras sem volume em litros conferido. A interface mostra “a confirmar”,
sem marcar esses valores como documentados. Watts não significam poder de sucção.
As famílias Midea DWA08/DWA14 estão nomeadas expressamente no manual oficial; os
sufixos elétricos/de cor não são inferidos nem publicados como variantes.
O lote de ar-condicionado tem 168 referências: Electrolux 19, Consul 9, Midea 8,
LG 10, Samsung 10, Gree 10, Daikin 24, Fujitsu 24, Carrier 8, Springer Midea 10,
Elgin 12, TCL 2, Hisense 3, Philco 13 e Agratto 6, entre 7.000 e 60.000 BTU/h. Inclui janela, portátil e
conjuntos split documentados. Nos LG S3-Q18KL33B/S3-Q24K233B e Samsung
F-AR60H24C1AWN, a capacidade nominal de refrigeração da ficha prevalece sobre
o título comercial: 19.000, 22.000 e 23.000 BTU/h, respectivamente.
Daikin: oito Full Inverter, oito EcoSwing Gold e oito EcoSwing legados, com pares
e BTU/h explícitos nas páginas 1–2 do registro Inmetro 001167/2021. Exclusões no
histórico não apagam a identidade; não se afirma certificação vigente ou disponibilidade.
Fujitsu: 12 Premium R32 e 12 Essencial R32, em catálogos Fujitsu General do Brasil
mantidos no portal GENERAL. Cada referência preserva as unidades interna/externa da
mesma coluna. Não foram corrigidos nem usados os códigos comerciais -Z inconsistentes
da linha Essencial 24 mil; os pares de unidades estão explícitos. A capacidade de frio
do ASKA18KPBA é 18.000 BTU/h, distinta do aquecimento de 18.430 BTU/h.
Carrier usa os conjuntos XPower Connect R32 do manual oficial, incluindo capacidades
nominais de 31.000 e 58.000 BTU/h que não devem ser deduzidas dos códigos 30/60.
Springer Midea é uma marca documental distinta de Midea. Elgin e Agratto têm
identidade e capacidade explícitas no registro Inmetro; TCL, Hisense e Philco usam
documentação dos fabricantes. Unidades avulsas e referências com divergências
não resolvidas de modelo/capacidade ficaram fora do lote.
O filtro `category` funciona na busca e em `/api/v1/products`, combinado com marca e texto.
As faixas `capacity=small|medium|large` continuam restritas às lavadoras, mesmo sem filtro
de categoria; litros e bocas nunca são comparados com kg.

`pnpm catalog:plan` seleciona explicitamente o lote preparado das 20 lavadoras,
valida as 40 associações de GTIN, identificador e tensão e indica
lacunas; `pnpm catalog:plan --json` exibe o plano com fontes. É uma operação inteiramente
local, sem carregar credenciais, conectar ao banco, aplicar SQL ou atribuir `verified`.
As regras de validação ficam no core. Erros de associação/duplicidade são recusados;
lacunas deixam a cobertura incompleta e o comando retorna código de saída diferente de zero.
`pnpm catalog:plan --all` confere todo o catálogo público e expõe os 239 modelos
sem variantes, com cobertura incompleta e saída não zero. `--json` funciona nos dois
escopos. O importador padrão mantém o lote preparado; acrescentar modelos à consulta
pública não os inclui silenciosamente na importação nem contorna lacunas de evidência.

Brastemp/Consul: GTIN e código completo vêm do mesmo item da API oficial; tensão nominal
vem da linha desse código no histórico do registro Inmetro 000727/2023. O histórico inclui
exclusões e alterações: é evidência de identidade/tensão, não uma alegação de certificação
vigente. Na Electrolux, EAN, referência `RefId` e tensão vêm do mesmo item da API, filtrando
`productReference` exato. A referência de catálogo fica distinguida do código comercial;
não foram inferidos os sufixos de revisão de PNC da etiqueta física.

A cobertura se limita aos 40 códigos escolhidos. Não comprova cobertura de todas as cores,
revisões e versões. Cada variante importada representa o item documentado do catálogo;
uma referência Electrolux não implica uma revisão física específica. Identificadores
guardam seu tipo (`manufacturer_reference` ou `catalog_reference`). Registros antigos
sem tipo permanecem com `code_kind` nulo e exigem revisão se colidirem com a importação.
Nenhuma revisão física é inferida, fundida ou habilitada para avaliações automaticamente.

## Banco e migrations

`db:generate` gera arquivos locais e não acessa o banco. As migrations são validadas
somente em PostgreSQL descartável. As funções da migration 0002
executam cada submissão/decisão/retirada em uma única transação PostgreSQL; Neon HTTP
não oferece transações interativas. Os locks seguem a ordem posse, avaliação e revisão.
`db:migrate` exige DATABASE_URL_DIRECT em apps/web/.env.local, conexão direta e banco autorizado.
O migrador usa advisory lock na mesma sessão. Não imprimir a connection string.
O build não importa catálogo nem cria administrador.

A migration 0005 acrescenta categoria, litros e número de bocas. Registros anteriores
recebem `washing_machine` e mantêm sua capacidade em kg; inserções legadas de lavadoras
continuam válidas. As constraints impedem misturar unidades e exigem kg nas lavadoras.
O snapshot administrativo inclui categoria e medidas: uma alteração invalida decisões
baseadas na leitura anterior. O preflight conectado exige a estrutura atualizada.
No futuro banco autorizado, aplicar a expansão antes do código novo e atualizar todos
os consumidores antes de importar/liberar categorias novas: versões antigas da aplicação
só compreendem lavadoras. Nenhuma migration foi aplicada a banco permanente.

A migration 0006 amplia a whitelist para 12 categorias, acrescenta `place_settings`
e `power_watts` e preserva duas casas decimais em `capacity_liters`. Snapshot, comparação
do importador e token de concorrência incluem as novas medidas. O preflight exige
versão de catálogo >= 5, colunas e constraints validadas. As versões 0008 e anteriores
permanecem inalteradas. Aplicar somente ao banco autorizado; atualizar os consumidores
antes de liberar categorias que eles ainda não reconheçam.

A migration 0007 adiciona `air_conditioner` e `cooling_capacity_btu_h`, amplia as
marcas aceitas pela revisão e inclui a capacidade no snapshot e token de concorrência.
A capacidade em BTU/h não deriva de watts elétricos nem da capacidade de aquecimento.
Em splits, cada referência corresponde a um conjunto documentado pelo fabricante;
unidades avulsas e pares deduzidos não entram. A busca reconhece `12000 BTU`,
`12.000 BTU/h` e `12,000 BTU/h`, preservando volumes decimais e GTINs exatos.

A migration 0008 amplia as marcas aceitas pela decisão administrativa para Daikin e
Fujitsu, preservando permissões, evidências, locks e auditoria. O preflight exige essa
versão para não iniciar com uma whitelist antiga. Não há alteração nas unidades de medida.

A migration 0009 acrescenta Carrier, Springer Midea, Elgin, TCL, Hisense, Philco e
Agratto à decisão administrativa; o preflight exige a versão 5. Marcas distintas
continuam separadas mesmo quando compartilham fabricante ou família comercial.

### Importação administrativa do catálogo

A migration 0003 é aditiva: acrescenta o tipo opcional de identificador às variantes e
a tabela de evidências por GTIN. Preserva o funcionamento da versão anterior e seus
registros sem classificação. Foi aplicada apenas ao PostgreSQL descartável dos testes.

Após autorização para o banco de destino e aplicação das migrations, configure
`DATABASE_URL_DIRECT` em `apps/web/.env.local`. O importador usa uma sessão PostgreSQL
direta (`pg`), não Neon HTTP, e recusa endereços Neon com `-pooler`. Ele não aplica migrations.

1. `pnpm catalog:plan`: valida somente os arquivos locais, sem conexão.
2. `pnpm catalog:import`: consulta o banco em transação somente de leitura e apresenta
   destino `host:porta/banco`, contagens de inserção e conflitos. Não grava sequer para simular.
3. Depois de conferir o destino e obter autorização para a gravação:
   `pnpm catalog:import --apply --expect-target=host:porta/banco`, substituindo pelo destino
   exato do relatório, sem usuário/senha. Não colocar connection string na linha de comando.

A aplicação refaz a comparação sob lock. Insere o lote inteiro em uma transação ou
reverte tudo; advisory lock compartilhado com o migrador e locks das quatro tabelas
serializam importações e protegem a comparação contra outras escritas. Há timeout de
lock de 10 segundos e de instrução de 30 segundos. Não executar dentro de outra transação.

Repetir o mesmo lote mantém IDs, flags de verificação e evidências existentes. O importador
só insere: nunca atualiza, apaga, reassocia GTIN ou concede papel. Divergência de modelo,
capacidade, tensão, tipo de identificador, fonte, data ou nota interrompe o lote para
reconciliação explícita. A data nova de uma reconferência não sobrescreve a anterior.
Conflitos retornam código de saída não zero. Parâmetros de conexão que podem alterar o
destino são recusados; credenciais e detalhes brutos de erros não são impressos.

Novos produtos e variantes entram com `verified=false`. A importação não abre avaliações,
não decide equivalência de revisões físicas e não substitui a ativação administrativa
posterior. O comando é administrativo,
recusado na hospedagem Vercel e não é chamado pelo build nem por rotas HTTP.

### Revisão e liberação do catálogo

No modo conectado, `/admin/catalogo` permite conferir e liberar/suspender modelos e
variantes separadamente. Só administradores podem ler essa área e enviar decisões por
`POST /api/v1/admin/catalog`; moderadores continuam limitados às contribuições.
A migration 0004 acrescenta a revisão do catálogo, o histórico e as funções atômicas.
O preflight exige essas funções. Nenhuma conta ganha papel com essa migration.

Cada liberação exige motivo e confirmação explícita das fontes. O core valida os dados;
o PostgreSQL revalida sessão/papel, estado e evidências na mesma transação da alteração
e do registro de auditoria. GTINs precisam de checksum válido, fonte HTTPS, evidência de
tensão, data não futura e nota. Referência sem classificação não pode ser liberada.
O modelo precisa estar liberado antes da variante. Identidade documental significa
referência + tensão + GTIN; não atesta uma revisão física, especialmente para `RefId`.
Uma ambiguidade documental deve manter o item suspenso até reconciliação explícita.

A decisão conserva responsável, motivo, data, estado anterior/posterior e snapshot das
evidências. A tela mostra as últimas 20 decisões de cada modelo; o banco conserva todas.
O token de concorrência inclui evidências e revisão monotônica: mudanças de dados ou
outro administrador tornam a tela antiga inválida (409). O token não é uma credencial.
As decisões serializam brevemente as tabelas do catálogo, inclusive contra o importador,
para proteger inserções de códigos/evidências durante a conferência. Adequado ao piloto
pequeno; revisar essa estratégia e paginar a listagem antes de ampliar o catálogo.

Suspender um modelo oculta variantes e relatos e impede novas avaliações. Preserva as
liberações individuais, que voltam a valer quando o modelo é reativado; suas evidências
são revalidadas nessa reativação. Suspender uma variante remove seus códigos/relatos da
consulta e impede novos envios. Suspensão funciona mesmo com evidência incompleta.
Correção de identidade/dados continua fora da tela: suspender antes de reconciliar no
banco autorizado. Não há gestão de papéis, criação de administrador nem exclusão de dados.

O fluxo foi testado por serviços/HTTP e PostgreSQL descartável: acesso, revogação,
concorrência, evidência alterada, rollback se a auditoria falhar e visibilidade pública.
A interação autenticada no navegador e OAuth real continuam pendentes.

### Consulta pública no modo conectado

Busca, página inicial, scanner, detalhes e formulário de avaliação usam a mesma leitura
do catálogo do servidor. Em preview, ela retorna os candidatos locais sem acessar banco.
Em connected, uma consulta seleciona apenas `products.verified=true`, com GTINs somente
de `variants.verified=true`. Um modelo verificado sem variantes verificadas pode aparecer
na busca por nome com lista vazia de códigos; isso não libera avaliações.

Importação com `verified=false` não publica modelos nem códigos. Revogar a verificação
remove os dados da próxima consulta. Não há cache público da API conectada nem cache
de catálogo entre requisições. Home e scanner conectados aguardam uma requisição antes
de consultar o banco; suas versões preview continuam estáticas.

O contrato do core distingue `mode=local_catalog`/`identification=candidate` de
`mode=database_catalog`/`identification=verified`. Os campos da prévia são preservados;
o `id` público permanece o slug, sem expor UUIDs de banco. Os mesmos filtros e validação
de GTIN atendem ambos os modos. Nenhum dado de conta ou rascunho participa da consulta.

Falhas de consulta ou dados fora do contrato retornam HTTP 503 e mensagem genérica na
API; páginas usam o estado de erro. Nunca usar o catálogo local como fallback conectado,
nem tratar falha como ausência de produto. Banco vazio resulta em catálogo vazio legítimo.
O fluxo Google/Neon/Upstash real continua pendente; esta leitura foi testada com banco
descartável e a prévia renderizada foi conferida por HTTP.

Migrations não rodam automaticamente no build. A prévia funciona sem segredos tanto
localmente quanto na Vercel. Build e inicialização recusam connected na Vercel. A futura
abertura de contas exige autorização, preservar expand/contract e conectar o migrador
ao ambiente correto. Preview hospedado
jamais compartilha banco ou segredos de produção. As funções são SECURITY INVOKER;
o banco não deve ser exposto diretamente ao navegador.

## Publicar somente a prévia do catálogo

Importar `n3tf4c3/duraverso`, branch `main`, na equipe escolhida pelo usuário, com nome
`duraverso`, Root Directory `apps/web`, Next.js, Node 24.x, build `pnpm run build`,
install `pnpm install --frozen-lockfile` e saída padrão. Manter os arquivos compartilhados
do monorepo acessíveis ao build. `engines.node` também está no pacote web.

Em Production e Preview: `DURAVERSO_MODE=preview` e `ENABLE_EXPERIMENTAL_COREPACK=1`.
O segundo usa o `packageManager` fixado na raiz. Não adicionar integrações Neon/Upstash
ou credenciais Google para essa etapa. Não é preciso APP_ORIGIN para a consulta pública;
o valor local padrão não é usado por login ou escritas, pois estão desativados.

Na primeira publicação conferir página inicial, busca, produto, conta desativada e
respostas 503 das rotas de login/escrita. A câmera usa HTTPS e depende de permissão.
Os textos identificam uma prévia do catálogo; não há avaliações, cadastro nem analytics.
As páginas pedem aos buscadores que não indexem essa fase. Publicar a prévia não abre
o piloto participativo e não dispensa conferir consumo e limites da hospedagem.

## Preparação do acesso conectado

Estes passos são pendências documentadas; não foram executados em serviços externos.

1. Reservar projeto Neon e store Upstash com limites compatíveis com o piloto. Conferir
   os planos vigentes e impedir upgrades automáticos antes de qualquer contratação.
2. Criar cliente Google OAuth para aplicação web. Para teste local, o retorno esperado
   é `http://localhost:3107/api/auth/callback/google`. Usar o navegador nessa mesma origem.
   A tela de consentimento e os usuários de teste precisam estar configurados no Google.
3. Colocar os valores reais somente em `apps/web/.env.local`, com base em `.env.example`:
   DATABASE_URL (Neon HTTP), DATABASE_URL_DIRECT (migrador), AUTH_SECRET aleatório de pelo
   menos 32 caracteres, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, UPSTASH_REDIS_REST_URL e TOKEN.
   APP_ORIGIN e AUTH_URL devem ser idênticos, sem caminho ou barra final. HTTP somente
   para localhost/127.0.0.1; fora disso, HTTPS. Não enviar segredos pelo chat.
4. Aplicar migrations apenas ao banco autorizado. Registrar produtos e variantes com
   evidência verificável e slugs iguais aos candidatos do catálogo. Nenhuma variante é
   criada automaticamente e nenhuma avaliação é aceita para modelo/variante não conferido.
5. Ativar `DURAVERSO_MODE=connected`, iniciar localmente e validar o login real. Depois,
   conceder o papel inicial ao identificador interno da conta correta por operação
   administrativa autorizada no banco. O navegador/e-mail nunca atribui esse papel.
6. Validar o ciclo real com contas de teste distintas: enviar, revisar, editar, pedir
   ajustes, retirar e revogar sessões. Só depois considerar abertura pública.

Auth.js está fixado em `next-auth@5.0.0-beta.32` para integração com o App Router.
É uma versão beta: a validação real com Google permanece obrigatória antes do piloto.
Não substituir nem atualizar automaticamente. Referência: https://authjs.dev/getting-started/installation

O perfil guarda o identificador Google e um apelido público inicial “Proprietário”.
E-mail, foto e tokens de acesso Google não são armazenados no banco nem no JWT do site.
O provedor precisa confirmar o e-mail. Sessões duram até 24 horas e consultam no banco
a versão e o papel atuais; “Sair de todos os dispositivos” invalida a versão anterior.
O papel administrativo não é atribuído automaticamente ao primeiro login.

## Avaliações e revisão

Há um voto por pessoa/modelo, vinculado a uma variante. Atualizar cria uma revisão
pendente e preserva a versão pública. Uma nova edição substitui a pendência anterior.
Repetir a mesma submissão não duplica votos. A API valida todos os campos no servidor.

O revisor publica, pede ajustes ou recusa com motivo obrigatório. Não pode revisar a
própria contribuição. A fila mostra até 100 pendências, mais antigas primeiro. Decisões
concorrentes têm somente um vencedor e deixam registro de responsável, motivo e data.
Retirar esconde a avaliação, remove o voto da média e cancela pendências; restauração
ainda não está disponível. Retirar avaliação não equivale a excluir a conta.

A página de produto mostra até 50 relatos aprovados por variante. A média considera
todos os relatos elegíveis, aparece a partir de 20 e é sempre preliminar. Google não
comprova posse nem garante uma única pessoa física por conta. Não há inferência de durabilidade.

A situação declarada aparece desde o primeiro relato aprovado, com os mesmos critérios da média:
contagens de “funciona normalmente”, “funciona com problema”, “não funciona” e de quem já
precisou de reparo, também por faixa de tempo de uso (menos de 1 ano, 1–2, 2–3, 3–5, 5 ou mais).
O tempo vai do início declarado até a aprovação da última versão do relato. São contagens, sem
percentual, nota ou estimativa de vida útil; a regra fica em `durabilitySummary` no core.
Edição pendente não altera a situação publicada.

As rotas de escrita exigem sessão atual, origem exata, JSON limitado a 16 KiB e proteção
compartilhada. O limite inicial é 30 escritas/minuto por conta, 60 requisições/minuto
globais nas rotas de autenticação e 60/minuto por identificador Google no login. Não se
confia em IP de cabeçalho. A cota global é conservadora e pode limitar usuários legítimos
num pico; reavaliar com evidência antes de ampliar o piloto. Falha/timeout do limitador
recusa a ação. Cada inicialização conectada também verifica o store, consumindo uma operação.

Conta, admin, envio e detalhes usam CSP com nonce e respostas dinâmicas sem cache público.
Os formulários conservam o texto quando o envio falha. As páginas públicas estáticas
conservam a CSP anterior; não há analytics, anúncios, uploads, IA paga ou e-mail transacional.

## Verificação local

`pnpm lint`, `pnpm web:build`, `pnpm typecheck`, `pnpm test` e `pnpm test:integration`.
A CI executa essas verificações em cada push na main e em pull requests. `pnpm audit --prod` verifica
dependências de produção; a ausência de alertas conhecidos não substitui os testes.

O runner de integração usa imagem PostgreSQL fixada por digest, senha sintética, porta
aleatória em 127.0.0.1 e tmpfs sem volumes do host. Confere um identificador exclusivo
antes dos testes e remove o contêiner no final. Um controle negativo remove a defesa de
variante somente nesse banco descartável: o teste correspondente deve falhar, a função
é restaurada e o comando geral termina com sucesso. Essa falha intermediária é intencional.

Foram verificados persistência, posse, permissões, revogação, edição sem apagar a versão
publicada, retirada, duplicidade de envio, concorrência e limiar de 20 proprietários.
Testes locais das rotas/callbacks cobrem origem, limites, sessão e redirecionamento.
A navegação no navegador foi conferida em preview. OAuth, Upstash/Neon reais, formulários
autenticados no navegador continuam sem validação ponta a ponta. O usuário confirmou leitura
de um código de produto fora do catálogo no Samsung A52s, seguida de busca sem resultado.
Isso valida esse caso de leitura, sem garantir todos os aparelhos, navegadores ou formatos.

## Antes da abertura pública

1. Banco, limitador e credenciais Google configurados em ambientes separados, com autorização.
2. Login Google e ciclo de contribuição validados de ponta a ponta com os serviços reais.
3. Catálogo persistente completo, variantes e códigos conferidos sem dados inventados.
4. Reparos detalhados e denúncias/reconsideração implementados; administração de catálogo validada com login real.
5. Store compartilhado e preflight verificados com as credenciais reais, inclusive indisponibilidade.
6. Privacidade, canal do responsável, retenção e exclusão definidos.
7. Integração com Postgres descartável e verificação de navegador/câmera em dispositivos reais.
8. Consumo disponível e controles de gastos conferidos, sem upgrades automáticos.
9. Só depois de autorização: hospedar com Root Directory apps/web, versões fixas e ambientes isolados.

Nenhum serviço é gratuito de forma ilimitada. Limites de banco/tráfego e trabalho manual
determinam o tamanho do piloto. O domínio próprio continua adiado.
