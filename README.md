# Academia Pro — Sistema de Gerenciamento

Sistema completo para gerenciamento de academia com:
- **Web** (painel administrativo) — Next.js
- **Mobile** (app do aluno) — React Native + Expo
- **API** (backend) — Node.js + Fastify + PostgreSQL

---

## Estrutura do Projeto

```
TCC-Sebastião/
├── apps/
│   ├── api/          # Backend Node.js + Fastify + Prisma
│   ├── web/          # Frontend Next.js (painel admin)
│   └── mobile/       # App React Native + Expo
└── packages/
    └── shared/       # Tipos TypeScript compartilhados
```

---

## Pré-requisitos

- Node.js 20+
- PostgreSQL 15+
- npm 10+
- Expo CLI (`npm install -g expo-cli`)

---

## Configuração Inicial

### 1. Banco de Dados

Crie o banco no PostgreSQL:
```sql
CREATE DATABASE academia_db;
```

### 2. Backend (API)

```bash
cd apps/api
cp .env.example .env
# Edite .env com sua DATABASE_URL e JWT_SECRET

npm install
npm run db:generate      # Gera o Prisma Client
npm run db:migrate       # Executa as migrations
npm run db:seed          # Popula com dados iniciais
npm run dev              # Inicia em http://localhost:3001
```

**Credenciais do seed:**
- Admin: `admin@gymtech.com` / `admin123`
- Personal: `carlos@gymtech.com` / `trainer123`
- Recepção: `ana@gymtech.com` / `recepcao123`
- Membro: `joao@exemplo.com` / `membro123`

Para publicar (Vercel + Railway + Supabase), veja [docs/DEPLOY.md](docs/DEPLOY.md).

Documentação da API: http://localhost:3001/docs

### 3. Frontend Web

```bash
cd apps/web
cp .env.local.example .env.local
npm install
npm run dev              # Inicia em http://localhost:3000
```

### 4. App Mobile

```bash
cd apps/mobile
npm install
npm run start            # Abre o Expo Dev Tools
```

Use o app **Expo Go** no celular para escanear o QR Code.
Para emulador: `npm run android` ou `npm run ios`

---

## Funcionalidades

### Painel Web (Admin)
| Tela | Funcionalidade |
|------|---------------|
| Dashboard | Métricas, receita, gráficos |
| Alunos | Listagem, busca, detalhes |
| Planos | Criar, editar, desativar planos |
| Assinaturas | Gerenciar, renovar, cancelar |
| Treinos | Catálogo de treinos e exercícios |
| Pagamentos | Histórico, confirmação manual |

### App Mobile (Aluno)
| Tela | Funcionalidade |
|------|---------------|
| Início | Visão geral, assinatura, histórico |
| Treinos | Ver e concluir treinos do plano |
| Assinatura | Ver plano, gerar pagamento (PIX/Boleto) |
| Perfil | Dados pessoais, estatísticas, sair |

---

## Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Backend | Node.js, Fastify, TypeScript |
| ORM | Prisma |
| Banco | PostgreSQL |
| Frontend Web | Next.js 14, React, Tailwind CSS |
| Mobile | React Native, Expo, Expo Router |
| Autenticação | JWT |
| Pagamentos | Mercado Pago (configurar Access Token) |
| Gráficos | Recharts |

---

## Integração com Mercado Pago

1. Crie uma conta em [mercadopago.com.br/developers](https://www.mercadopago.com.br/developers)
2. Gere um Access Token
3. Adicione no `.env` da API:
   ```
   MP_ACCESS_TOKEN=APP_USR-...
   ```
4. Configure o webhook para `POST /payments/webhook`

---

## Estrutura do Banco de Dados

```
User ──────────────── Subscription ──── Payment
 │                         │
 └── WorkoutLog            └── Plan ──── PlanWorkout ──── Workout
                                                              │
                                                          Exercise
```
