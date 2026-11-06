# Duraverso

## Produto e limites

Plataforma de experiências de proprietários de produtos: lavadoras, geladeiras, micro-ondas e fogões.
Consulta pública; Google será o único login inicial. Revisão manual antes da publicação.
Satisfação é diferente de durabilidade. Não criar avaliações, percentuais ou selos fictícios.
Média preliminar somente com 20 avaliações elegíveis de proprietários distintos por variante.
Um voto ativo por pessoa/modelo. Atualizar não cria outro voto. Anexos e mobile ficam fora do piloto.
Meta de custo recorrente adicional zero. Publicação, contratação e provisionamento externo precisam de autorização.

## Stack e comandos

pnpm workspaces, Node 24 (versão em .nvmrc), Next.js App Router, React, Tailwind,
TypeScript; Drizzle e Neon preparados. packages/core contém domínio e contratos sem framework.
Somente pnpm, versão exata em packageManager, um lockfile na raiz. Não usar npm install.

- pnpm web: inicia desenvolvimento local em 127.0.0.1:3107.
- pnpm web:build: build de produção local, sem aplicar migrations.
- pnpm web:start: serve o build local na mesma porta.
- pnpm lint, pnpm typecheck, pnpm test: verificações dos dois workspaces.
- pnpm test:integration: PostgreSQL descartável em Docker, sem volumes do host, com limpeza automática.
- pnpm --filter @duraverso/web db:generate: gera SQL local a partir do esquema.
- pnpm --filter @duraverso/web db:migrate: aplica SQL; só executar com banco e autorização apropriados.

## Estado operacional da base

O modo preview usa catálogo estático de candidatos. Não há banco em produção. Não inferir variantes/GTIN.
Categoria e medidas pertencem ao contrato canônico: kg somente para lavadoras, litros
para geladeiras/micro-ondas e bocas para fogões. Filtros de kg nunca comparam outras unidades.
No modo connected, a consulta pública usa produtos verificados do banco e somente GTINs
de variantes verificadas. Importar não publica: novos registros entram não verificados.
Falha do banco não pode ser substituída por candidatos locais nem confundida com catálogo vazio.
O modo preview mantém contas e escritas desativadas e funciona sem serviços externos.
Somente esse modo pode ser hospedado na Vercel; guardas no build e na inicialização
recusam connected. A prévia hospedada não aplica migrations nem exige banco/Google/Redis.
O modo connected integra Google, sessões, avaliações e revisão manual; depende de Neon,
credenciais Google e Upstash configurados e verificados no preflight. Nada foi provisionado.
Não habilitar gravação nem publicar o modo conectado apenas removendo as guardas.
Antes de abrir contas concluir: teste OAuth real de ponta a ponta, conferência das variantes,
catálogo persistente completo, administração inicial autorizada e política de privacidade.

## Invariantes para a continuidade

- Regras e contratos canônicos no core, consumidos pelo web/API; testes de conformidade no web.
- Catálogo publicado é público; posse/conta/rascunhos exigem filtro de dono no servidor.
- Papel administrativo vem do banco; nenhuma permissão vinda do cliente, query string ou e-mail de formulário.
- Decisões de catálogo exigem administrador, motivo e evidências conferidas; estado e auditoria são atômicos. Mudanças desde a leitura invalidam a decisão. Referência de catálogo não comprova revisão física.
- Alteração pendente fica em review_revisions e não substitui o voto publicado antes da revisão.
- Moderador não revisa a própria contribuição. Decisões registram motivo/responsável/data.
- Proibir rebaixar/excluir o último administrador, de forma atômica, antes de habilitar gestão de papéis.
- Sessões revogáveis e segredos distintos por ambiente; Google não comprova posse/identidade única.
- Route handlers com cookies: validar Origin em POST/PUT/PATCH/DELETE; GET nunca altera estado.
- Proteção de abuso em store compartilhado provisionado antes de habilitar rotas. Falhas de escritas sensíveis negam operação; qualquer degradação de login precisa controle compensatório persistido.
- Neon HTTP não tem transação interativa. Usar batch/operações condicionais; não simular atomicidade em várias requisições.
- Migrador usa conexão direta, advisory lock na mesma sessão e SQL LF. Alterações sempre compatíveis com versão anterior.
- Futuro deploy: Root Directory apps/web; mesmas versões Node/pnpm, lockfile congelado, ambientes separados.
- Não compartilhar segredo/banco de produção com preview. Preflight deve impedir boot mal configurado.
- Sem logs de credenciais, URLs de conexão, dados pessoais ou formulários completos.
- Manter permissão de câmera restrita ao próprio site; parar câmera ao sair/ocultar tela.
- Conta, avaliação, admin e detalhes de produto usam CSP com nonce e renderização dinâmica. Páginas estáticas preservam CSP própria. Não liberar origens arbitrárias para OAuth, que usa redirecionamento.
- Mobile futuro deverá alinhar a árvore React e consumir /api/v1; não criar app vazio agora.

## Testes e arquivos

Executar lint, build, typecheck e testes. O build vem antes do typecheck (.next/types).
Todo workspace declara test. Testes de unidade não comprovam constraints no Postgres.
Escritas/destruição em testes só em ambientes descartáveis próprios e identificados.
Nunca usar caminhos reais para testar se scripts destrutivos recusam.
Arquivos em C:\Codes; temporários só em subpasta própria e removidos ao finalizar.

## Memória

Usar ai-memory com workspace/project do .ai-memory.toml. Não usar memória nativa do Codex.
Consultar memória antes de decisões relevantes. Registrar uma nota de retomada ao concluir
alterações em código/dados/releases/auditoria: trabalho, validação, commits, estado publicado,
pendências e contornos. Sem segredos ou dados pessoais. AGENTS guarda regras estáveis;
decisões, estado e pendências evolutivas ficam no ai-memory.
