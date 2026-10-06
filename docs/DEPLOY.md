# Deploy do GymTech

Arquitetura: **web na Vercel**, **API na Railway** (ou Render) e **Postgres na nuvem** (Supabase).

A API é um servidor Fastify que fica sempre ligado e roda um ciclo de cobrança a cada hora dentro do próprio processo. Por isso ela não roda como função serverless da Vercel.

## 1. Banco de dados (Supabase)

O Supabase é um Postgres comum, então o Prisma funciona sem alteração no schema. O cuidado é qual connection string usar. No painel do projeto, em **Connect**, existem três:

| Conexão | Porta | Use para |
|---|---|---|
| **Session pooler** | 5432 | **Recomendada.** Funciona na Railway (IPv4), aceita migrações e o uso normal da API. |
| Transaction pooler | 6543 | Não use com `prisma migrate`. Só serve para serverless, com `?pgbouncer=true`. |
| Direct connection | 5432 | Só IPv6 no plano gratuito. Pode não conectar a partir da Railway. |

Use a URL do **Session pooler** como `DATABASE_URL`. O usuário dela é `postgres.<ref-do-projeto>` e a senha é a do banco (Project Settings, Database). Se ela tiver caracteres especiais, codifique-os na URL (`@` vira `%40`). Para desenvolver, cole a mesma URL no `apps/api/.env`, e não precisa instalar Postgres nem Docker.

**Banco que já tem tabelas?** O `migrate deploy` só funciona em banco vazio ou em banco que já tenha o histórico de migrações do Prisma. Se o Supabase já tem tabelas criadas de outro jeito (por exemplo `db push`), o comando falha com o erro `P3005`. Rode `npx prisma migrate status` apontando para ele e veja o que aparece antes de qualquer deploy.

## 2. API (Railway)

1. Crie um serviço a partir do repositório, com **Root Directory** `apps/api`. O `railway.json` dessa pasta já define o build e o start.
2. O start roda `npx prisma migrate deploy`, que aplica as migrações versionadas em `apps/api/prisma/migrations/`. O banco é criado sozinho no primeiro deploy.
3. Variáveis de ambiente:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | URL do Session pooler do Supabase |
| `JWT_SECRET` | segredo longo e aleatório. **Obrigatório**: sem ele a API usa um segredo de desenvolvimento conhecido |
| `CORS_ORIGIN` | domínio do site na Vercel, ex. `https://gymtech.vercel.app` (vários, separados por vírgula) |
| `TZ` | `America/Sao_Paulo` (já é o padrão do código; defina se a academia estiver em outro fuso) |
| `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET` | credenciais do Mercado Pago |

4. Depois do primeiro deploy, rode o seed uma vez para criar os usuários e as turmas de exemplo: `npx prisma db seed` (pelo terminal da Railway ou local, com `DATABASE_URL` apontando para o Supabase). Em produção real, troque as senhas do seed.

## 3. Web (Vercel)

1. Importe o repositório com **Root Directory** `apps/web`. O framework é detectado como Next.js.
2. Variável de ambiente: `NEXT_PUBLIC_API_URL` = URL pública da API na Railway.
3. Faça o deploy. Depois, volte à Railway e confira que `CORS_ORIGIN` bate com o domínio final.

## Migrações

- Alterou o `schema.prisma`? Em desenvolvimento, rode `npx prisma migrate dev --name <descricao>` e **commite a pasta gerada** em `apps/api/prisma/migrations/`. É ela que o deploy aplica.
- Histórico atual: `20260517040158_init` (base original) e `20260920120000_add_features` (avaliação física, notificações, agenda de aulas, papel de recepção, congelamento e treinos do personal).
- A migração `add_features` troca o valor `INSTRUCTOR` do enum `UserRole` por `PERSONAL_TRAINER`. Num banco que já tenha usuários com papel `INSTRUCTOR`, ela falha. Atualize esses usuários antes.
- Se seu banco local foi criado com outra sequência de migrações, o `migrate dev` acusa divergência. Recrie-o com `npx prisma migrate reset` (apaga os dados).

## Ciclo de cobrança

O ciclo (`runBillingCycle`) roda a cada hora enquanto a API estiver de pé. Na Railway isso funciona sem ajuste. Se um dia a API for movida para serverless, troque o `setInterval` por um cron que chame `POST /billing/run`.
