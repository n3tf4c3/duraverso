# Operação local e preparação externa

## Escopo da entrega

Esta é a base local, não o piloto público completo. O catálogo inicial e sua API usam
20 candidatos embutidos. No modo conectado, avaliações, contas e revisão manual usam
persistência real. Nenhum recurso externo, domínio ou administrador foi criado.

O padrão `DURAVERSO_MODE=preview` funciona sem credenciais e recusa login e todas as
escritas com HTTP 503. Não há login simulado ou atalho de administrador para testes.
O modo `connected` somente inicia após validar configuração, funções SQL e acesso ao
limitador compartilhado. Falhas impedem a abertura das rotas sensíveis.

## Recursos locais

Servidor vinculado apenas a 127.0.0.1:3107. Câmera depende de permissão e navegador.
Permissão negada, dispositivo indisponível ou GTIN desconhecido têm pesquisa manual como alternativa.
Nenhuma captura da câmera é enviada. A biblioteca de leitura só carrega ao solicitar a câmera.

As fontes do catálogo estão em `apps/web/src/lib/catalog.ts`; código completo,
voltagem e GTIN precisam de evidência antes da criação de uma variante verificada.
GTIN ausente não impede busca por marca/modelo; nunca adivinhar a correspondência.

## Banco e migrations

`db:generate` gera arquivos locais e não acessa o banco. As migrations 0000, 0001 e 0002
foram aplicadas e testadas em PostgreSQL descartável. As funções da migration 0002
executam cada submissão/decisão/retirada em uma única transação PostgreSQL; Neon HTTP
não oferece transações interativas. Os locks seguem a ordem posse, avaliação e revisão.
`db:migrate` exige DATABASE_URL_DIRECT em apps/web/.env.local, conexão direta e banco autorizado.
O migrador usa advisory lock na mesma sessão. Não imprimir a connection string.
Não há seed que crie administrador ou escreva candidatos em produção.

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
autenticados no navegador e câmera em dispositivo real continuam sem validação ponta a ponta.

## Antes da abertura pública

1. Banco, limitador e credenciais Google configurados em ambientes separados, com autorização.
2. Login Google e ciclo de contribuição validados de ponta a ponta com os serviços reais.
3. Catálogo persistente completo, variantes e códigos conferidos sem dados inventados.
4. Reparos detalhados, denúncias/reconsideração e administração de catálogo implementados conforme o recorte do piloto.
5. Store compartilhado e preflight verificados com as credenciais reais, inclusive indisponibilidade.
6. Privacidade, canal do responsável, retenção e exclusão definidos.
7. Integração com Postgres descartável e verificação de navegador/câmera em dispositivos reais.
8. Consumo disponível e controles de gastos conferidos, sem upgrades automáticos.
9. Só depois de autorização: hospedar com Root Directory apps/web, versões fixas e ambientes isolados.

Nenhum serviço é gratuito de forma ilimitada. Limites de banco/tráfego e trabalho manual
determinam o tamanho do piloto. O domínio próprio continua adiado.
