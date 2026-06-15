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
