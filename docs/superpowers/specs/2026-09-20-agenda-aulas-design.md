# Agenda de aulas coletivas — Design

## Objetivo

Permitir que a academia cadastre turmas com horário semanal recorrente e que alunos (ou a recepção, em nome deles) reservem vaga em cada aula, respeitando a capacidade máxima.

## Decisões

- Turmas seguem um horário semanal recorrente (ex.: Spinning toda terça às 07:00). Não há aulas avulsas de data única.
- O aluno reserva para si. Recepção e admin reservam em nome de um aluno.
- Aula lotada bloqueia novas reservas. Não há lista de espera.
- Cada turma tem um instrutor: um usuário com role `PERSONAL_TRAINER`.
- A janela de reserva é de 7 dias à frente.
- Reservar exige assinatura com status `ACTIVE`. O texto livre de `Plan.features` não é interpretado.
- O aluno cancela a própria reserva até o início da aula. Recepção e admin cancelam qualquer reserva.
- Só o admin cria, edita e remove turmas. A recepção visualiza a agenda e reserva/cancela.

## Limitação conhecida

Duas reservas simultâneas na última vaga podem ultrapassar a capacidade, porque a contagem e a criação não rodam em uma transação serializável. Aceito para o escopo do TCC.

## Fora do escopo

Lista de espera, aulas avulsas, notificação de reserva, check-in na aula.

## Modelo de dados (Prisma)

`ClassSchedule`
- `id`, `name`, `description?`
- `instructorId` → `User` (role `PERSONAL_TRAINER`)
- `weekday` (0 = domingo … 6 = sábado)
- `startTime` (`"HH:mm"`), `durationMinutes`
- `capacity`, `isActive` (default `true`)

`ClassBooking`
- `id`, `scheduleId` → `ClassSchedule`, `userId` → `User`
- `classDate` (`"YYYY-MM-DD"`, a data da ocorrência)
- `status`: `BOOKED` | `CANCELLED`
- `bookedById` → `User` (quem fez a reserva: o próprio aluno ou a recepção/admin)
- `createdAt`
- Único em `(scheduleId, userId, classDate)`. Cancelar muda o status; reservar de novo reativa a mesma linha.

As ocorrências não são gravadas. Elas são calculadas a partir das turmas ativas.

## Lógica pura (`apps/api/src/lib/classes.ts`, testada com vitest)

- `getUpcomingOccurrences(schedules, from, days)` devolve `{ scheduleId, date, startsAt }` para cada aula dos próximos `days` dias, ordenado por `startsAt`. Ignora turmas com `isActive = false`.
- `checkBooking({ capacity, bookedCount, alreadyBooked, hasActiveSubscription, startsAt, now })` devolve `{ ok: true }` ou `{ ok: false, reason }`, com `reason` em `FULL`, `ALREADY_BOOKED`, `NO_ACTIVE_SUBSCRIPTION`, `ALREADY_STARTED`.
- `canCancelBooking({ isOwner, isStaff, startsAt, now })`: a equipe sempre cancela; o dono cancela só antes do início.
- `getStartsAt(date, startTime)` e `formatLocalDate(date)` são os helpers de data usados pelas funções acima e pelas rotas.
- Datas de ocorrência são strings `YYYY-MM-DD` em horário local do servidor, para evitar erro de fuso.

## API (Fastify)

Arquivo novo `apps/api/src/routes/classes.ts`, registrado em `/classes`.

- `GET /`, `POST /`, `PUT /:id`, `DELETE /:id`: `requireAdmin`. `GET /` lista todas as turmas, inclusive inativas, para a tela de gerenciamento. Validação com zod. `instructorId` precisa ser um `PERSONAL_TRAINER`.
- `GET /agenda?days=7`: `authenticate`. Devolve as ocorrências com `capacity`, `bookedCount`, `spotsLeft`, instrutor e `bookedByMe`.
- `POST /:id/bookings` com `{ date, userId? }`: `authenticate`. Sem `userId`, reserva para o usuário logado. Com `userId`, exige `ADMIN` ou `RECEPTIONIST`. Valida a data dentro da janela e que ela cai no `weekday` da turma, depois aplica `checkBooking`. Recusas voltam com 400/409 e mensagem em português.
- `DELETE /bookings/:bookingId`: dono da reserva, `RECEPTIONIST` ou `ADMIN`. Aluno não cancela aula que já começou.

## Web (Next.js)

- `/dashboard/aulas`: agenda dos próximos 7 dias para admin e recepção, com reserva em nome de um aluno (busca por nome). O admin também vê o gerenciamento de turmas (criar, editar, desativar).
- `/membro/aulas`: agenda de 7 dias com vagas restantes e botões Reservar/Cancelar.
- `Sidebar.tsx`: item "Aulas". `MemberSidebar`: item "Aulas".
- `permissions.ts`: `/dashboard/aulas` entra em `RECEPTIONIST_ALLOWED_PREFIXES`, com teste.
- Tipos compartilhados em `packages/shared`.

## Testes

- `classes.test.ts`: ocorrências (dia da semana certo, janela de 7 dias, turma inativa ignorada, ordenação) e `checkBooking` (cada motivo de recusa e o caso ok).
- `permissions.test.ts`: recepção acessa `/dashboard/aulas`.
- Rotas e Prisma ficam sem teste automatizado, como nas tarefas anteriores. Validação manual depende do Postgres local.

## Migração

`npx prisma migrate dev` cria as tabelas `ClassSchedule` e `ClassBooking`. Junta-se às migrações pendentes das tarefas anteriores.
