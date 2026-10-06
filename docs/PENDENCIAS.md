# Pendências do GymTech

Atualizado em 20/09/2026. Este arquivo guarda o que ficou para fazer quando houver um banco Postgres disponível, e o que ainda falta construir.

## 1. Banco de dados (bloqueia a verificação de tudo)

Nada do que foi feito nesta fase rodou contra um banco. As rotas e as telas só passaram por typecheck e testes unitários da lógica pura.

- [ ] Confirmar qual é o banco (acredita-se que seja o Supabase) e se ele já tem tabelas (painel, **Table Editor**).
- [ ] Copiar a URL do **Session pooler** (porta 5432, usuário `postgres.<ref-do-projeto>`) para `DATABASE_URL` em `apps/api/.env`. Não colar a senha em chats nem commitar o `.env`.
- [ ] Rodar `npx prisma migrate status` em `apps/api` e ver o resultado:
  - **Banco vazio:** `npx prisma migrate deploy`, depois `npx prisma db seed`.
  - **Banco com tabelas e sem histórico do Prisma** (erro `P3005`): decidir entre marcar a `init` como aplicada (`prisma migrate resolve --applied 20260517040158_init`, só se o banco bater com ela) ou recriar o banco (**apaga os dados**).
  - **Banco com usuários de papel `INSTRUCTOR`:** atualizá-los para `PERSONAL_TRAINER` antes, senão a migração `add_features` falha.
- [ ] Alternativas se o Supabase não servir: Docker (`docker run --name gymtech-db -e POSTGRES_PASSWORD=senha123 -e POSTGRES_DB=academia_db -p 5432:5432 -d postgres:16`, com o Docker Desktop aberto) ou instalar o Postgres no Windows.

Migrações no repositório (`apps/api/prisma/migrations/`):
- `20260517040158_init`: base original, 8 tabelas.
- `20260920120000_add_features`: tabelas Notification, PhysicalAssessment, ClassSchedule, ClassBooking, PersonalWorkout, PersonalExercise e PersonalWorkoutLog; valores `RECEPTIONIST`, `PERSONAL_TRAINER` e `FROZEN`; coluna `frozenAt`. Gerada por diff e conferida contra a `init`, mas **nunca aplicada em um banco**.

## 2. Roteiro de teste manual (depois que o banco estiver de pé)

Logins do seed: `admin@gymtech.com` / `admin123`, `carlos@gymtech.com` / `trainer123` (personal), `ana@gymtech.com` / `recepcao123` (recepção), `joao@exemplo.com` / `membro123` (aluno).

- [ ] **Cobrança:** admin em Notificações, botão "Rodar ciclo de cobrança agora". Confere se assinatura vencida vira inadimplente e se a cobrança do próximo ciclo é gerada.
- [ ] **Dashboard:** cartões de MRR e Taxa de Retenção com valores coerentes.
- [ ] **Avaliação física:** perfil do aluno (`/dashboard/alunos/[id]`), lançar avaliação e ver o gráfico.
- [ ] **Recepção:** entrar como Ana. Deve ver só Alunos, Assinaturas, Pagamentos e Aulas, e cair em `/dashboard/alunos` ao tentar abrir outra rota.
- [ ] **Congelamento:** congelar e retomar uma assinatura, e conferir que o vencimento avança pelos dias congelados.
- [ ] **Agenda de aulas:** reservar como aluno e como recepção (em nome do João). Tentar reservar duas vezes (deve recusar), lotar uma turma (deve recusar), cancelar e reservar de novo, e ver a aula já iniciada bloqueada.
- [ ] **Check-in de treino:** concluir um treino duas vezes no mesmo dia (a segunda deve mostrar "Concluído hoje"), no mobile e na web, incluindo os treinos do personal.
- [ ] **Validação:** mandar entrada inválida numa rota (ex. capacidade 0 em `POST /classes`) e ver resposta 400, não 500.

## 3. Publicação

Guia completo em [DEPLOY.md](DEPLOY.md). Arquitetura: web na Vercel, API na Railway, banco no Supabase.

- [ ] Vercel: importar o repositório com **Root Directory** `apps/web` (já existe um projeto `web` ligado em `.vercel/`; conferir que ele usa essa pasta). Variável `NEXT_PUBLIC_API_URL`.
- [ ] Railway: serviço com **Root Directory** `apps/api`. Variáveis `DATABASE_URL`, `JWT_SECRET` (**obrigatório**, sem ele a API usa um segredo de desenvolvimento conhecido), `CORS_ORIGIN`, `TZ`, `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`.
- [ ] Trocar as senhas do seed em produção.
- [ ] A API não roda como função serverless da Vercel: ela é um servidor contínuo e o ciclo de cobrança usa `setInterval`.

## 4. Git

- [ ] Alterações sem commit: check-in de treino (API, mobile e web), migração `add_features`, `docs/DEPLOY.md`, `docs/PENDENCIAS.md` e ajustes no `README.md`.
- [ ] Já commitado na branch `feat/gestao-alunos-agenda-aulas`: landing page (`39fd620`) e as funcionalidades de gestão e agenda (`b124a0d`). Nada foi enviado ao remoto.
- [ ] Deixados fora dos commits de propósito: `.claude/settings.local.json` (config local) e `apps/web/tsconfig.tsbuildinfo` (artefato de build).

## 5. Ainda não construído

**Núcleo**
- [ ] Contrato digital com assinatura eletrônica.
- [ ] Relatório dedicado de churn e MRR, com evolução no tempo. Hoje só existem os cartões no dashboard.

**Nutricionista IA** (nenhuma das 12 tarefas iniciada; depende da avaliação física, que já existe)
- [ ] Formulário de anamnese nutricional e modelo de dados do perfil.
- [ ] Integração com a API de LLM.
- [ ] Cálculo de TMB, gasto calórico e macros.
- [ ] Geração do cardápio semanal.
- [ ] Regras de segurança e avisos (alergias, restrições médicas).
- [ ] Exportação em PDF, histórico e regeneração da dieta.
- [ ] Reajuste automático por evolução.
- [ ] Tela da dieta no app do aluno.
- [ ] Painel de revisão para o admin.
- [ ] Validação de qualidade das dietas geradas.

**Backlog:** gamificação, loja de produtos, armários, programa de indicação, multi-unidade, mural e chat, pesquisa de satisfação (NPS), comissão de personal.

## 6. Menores adiados (qualidade)

- Agenda de aulas: grids fixos que apertam no celular; erro de mutação antigo fica na tela; sem confirmação ao cancelar reserva; o campo `description` da turma existe mas nenhuma tela o preenche ou mostra.
- `checkBooking`: faltam testes de fronteira (aula começando exatamente agora) e de precedência entre recusas.
- Handler global de erros: já registra o erro no log, mas vale conferir os logs de 5xx na primeira execução real.
- Limitação aceita: duas reservas simultâneas na última vaga de uma aula podem ultrapassar a capacidade (sem transação serializável).
- `ClassScheduleManager`: instrutores e alunos vêm de `GET /users` com `perPage` fixo; com muitos usuários vale paginar ou buscar por texto.

## 7. Correção de um engano registrado na sessão

Foi dito que `prisma/migrations/` estava no `.gitignore`. Não estava: o padrão só vale para a raiz. O problema real era a `init` desatualizada, já resolvida pela migração `add_features`.
