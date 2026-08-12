# GymTech — Sistema de Gestão de Academia

**TCC — E.E. Professor Sebastião de Castro — 3ª Série NA — Grupo 02**

Alisson · Cauã · Renan · Diego · Matheus

---

## Como rodar o projeto

### Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- npm

### 1. Banco de dados

Crie o banco no PostgreSQL:

```sql
CREATE DATABASE gymtech;
```

### 2. Backend

```bash
cd backend

# Copiar e configurar o .env
copy .env.example .env
# Edite o .env com sua URL do banco PostgreSQL

# Instalar dependências
npm install

# Gerar o cliente Prisma e criar as tabelas
npm run db:push

# Popular dados iniciais (admin + exercícios + planos)
npm run db:seed

# Iniciar em modo desenvolvimento
npm run dev
```

O backend roda em **http://localhost:3001**

### 3. Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Iniciar em modo desenvolvimento
npm run dev
```

O frontend roda em **http://localhost:5173**

---

## Acesso inicial

| Perfil | E-mail | Senha |
|---|---|---|
| Administrador | admin@gymtech.com | admin123 |

---

## Estrutura do Projeto

```
TCC-Escola/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma    # Modelo do banco de dados
│   │   └── seed.js          # Dados iniciais
│   ├── src/
│   │   ├── routes/          # Rotas da API
│   │   ├── middleware/      # JWT e permissões
│   │   └── utils/           # CPF, cron job
│   └── .env                 # Configurações (não comitar)
├── frontend/
│   ├── src/
│   │   ├── pages/           # Telas do sistema
│   │   ├── components/      # Componentes reutilizáveis
│   │   ├── contexts/        # AuthContext
│   │   ├── services/        # Axios API
│   │   └── utils/           # Formatadores
│   └── .env                 # URL da API
└── specs/
    └── specs.md             # Especificação do sistema
```

---

## Telas do sistema

| Tela | Descrição | Perfis |
|---|---|---|
| Login | Autenticação | Todos |
| Dashboard | Indicadores da academia | Admin, Recepção |
| Alunos | Lista e busca de alunos | Admin, Recepção, Instrutor |
| Cadastro de Aluno | Formulário de cadastro/edição | Admin, Recepção |
| Funcionários | Gestão de funcionários | Admin |
| Planos | Planos disponíveis | Admin |
| Matrículas | Vinculação aluno × plano | Admin, Recepção |
| Financeiro | Pagamentos e cobranças | Admin, Recepção |
| Fichas de Treino | Montagem de treinos | Admin, Instrutor |
| Meu Treino | Visão do aluno | Aluno |
| Check-in | Registro de entrada | Admin, Recepção |
| Relatórios | Receita, inadimplência, frequência | Admin |

---

## Tecnologias

**Frontend:** React 18 · Vite · Tailwind CSS v4 · React Router · Axios · Chart.js

**Backend:** Node.js · Express · Prisma · PostgreSQL · JWT · bcrypt · pdfkit · node-cron

---

## Deploy em produção (grátis)

Stack: **Neon** (banco Postgres) + **Render** (backend) + **Vercel** (frontend).

### 1. Banco de dados (Neon)

1. Crie uma conta em [neon.tech](https://neon.tech) e um novo projeto Postgres.
2. Copie a **Connection String** (algo como `postgresql://user:senha@ep-xxx.neon.tech/neondb?sslmode=require`). Você vai usar como `DATABASE_URL`.

### 2. Backend (Render)

1. Crie uma conta em [render.com](https://render.com) e conecte seu GitHub.
2. Clique em **New > Blueprint**, selecione este repositório. O Render vai ler o `render.yaml` da raiz e criar o serviço `gymtech-backend` automaticamente (root dir `backend`, build e start já configurados).
3. Nas variáveis de ambiente do serviço, preencha:
   - `DATABASE_URL`: a connection string do Neon.
   - `FRONTEND_URL`: deixe em branco por enquanto (você volta aqui depois do passo 3).
4. Depois do deploy, anote a URL pública do backend (ex: `https://gymtech-backend.onrender.com`).
5. (Opcional) rode o seed uma vez pelo **Shell** do Render: `npm run db:seed`.

> Plano free do Render "dorme" após 15 min sem uso (primeiro acesso demora ~30s pra acordar), e o `uploads/` (fotos de alunos) é um disco efêmero — arquivos enviados somem a cada novo deploy/restart. Para produção de verdade, vale trocar upload local por um serviço como Cloudinary/S3.

### 3. Frontend (Vercel)

1. Crie uma conta em [vercel.com](https://vercel.com) e importe este repositório.
2. Em **Root Directory**, selecione `frontend` (a Vercel detecta Vite automaticamente).
3. Em **Environment Variables**, adicione `VITE_API_URL` com a URL do backend do Render (passo 2.4).
4. Deploy. Anote a URL gerada (ex: `https://gymtech.vercel.app`).

### 4. Fechar o ciclo

Volte no Render, edite a variável `FRONTEND_URL` do backend com a URL da Vercel (passo 3.4) e salve — isso libera o CORS para o frontend em produção acessar a API.
