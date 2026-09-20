# Agenda de aulas coletivas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turmas com horário semanal recorrente, com reserva de vaga pelo aluno ou pela recepção/admin, respeitando a capacidade máxima.

**Architecture:** As regras (geração de ocorrências, validação de reserva, permissão de cancelamento) ficam em funções puras em `apps/api/src/lib/classes.ts`, testadas com vitest. As rotas Fastify em `apps/api/src/routes/classes.ts` só ligam essas funções ao Prisma. No web, duas páginas (aluno e staff) consomem `GET /classes/agenda`.

**Tech Stack:** Fastify 4, Prisma 5 (PostgreSQL), zod, vitest 4, Next.js 14, React Query, Tailwind, lucide-react.

**Spec:** `docs/superpowers/specs/2026-09-20-agenda-aulas-design.md`

## Global Constraints

- Textos de interface, mensagens de erro da API e nomes visíveis em português do Brasil.
- Datas de ocorrência são strings `YYYY-MM-DD` em horário local do servidor; horários são `"HH:mm"`. Nunca usar `toISOString()` para derivar a data da aula.
- Janela de reserva: 7 dias à frente, contando o dia de hoje.
- Reservar exige assinatura com status `ACTIVE`.
- Só `ADMIN` cria, edita e remove turmas. `ADMIN` e `RECEPTIONIST` reservam em nome de um aluno e cancelam qualquer reserva. O aluno cancela a própria reserva até o início da aula.
- `instructorId` deve apontar para um usuário com role `PERSONAL_TRAINER`.
- Não há Postgres nem Docker disponíveis neste ambiente: não rodar `prisma migrate`. Só `npx prisma generate`. A migração fica para o usuário rodar (`npx prisma migrate dev`).
- Testes: `npx vitest run` dentro de `apps/api` e de `apps/web`. Typecheck: `npx tsc --noEmit` em cada app.
- No PowerShell, entrar nas pastas com caminho absoluto: `Set-Location "C:\Users\user\OneDrive\Documentos\TCC-Sebastião\apps\api"` (o diretório de trabalho não é confiável entre chamadas).
- Não fazer `git commit` a menos que o usuário peça. Cada tarefa termina com testes e typecheck verdes, não com commit.
- Rotas e Prisma não têm teste automatizado (sem banco). A lógica testável fica nas funções puras.

---

## File Structure

- Create `apps/api/src/lib/classes.ts`: regras puras (ocorrências, validação de reserva, cancelamento).
- Create `apps/api/src/lib/classes.test.ts`: testes das regras.
- Modify `apps/api/prisma/schema.prisma`: `BookingStatus`, `ClassSchedule`, `ClassBooking` e relações em `User`.
- Modify `packages/shared/src/types.ts`: `ClassSchedule`, `AgendaItem`.
- Create `apps/api/src/routes/classes.ts`: rotas `/classes`.
- Modify `apps/api/src/server.ts`: registrar as rotas.
- Modify `apps/api/src/seed.ts`: turmas de exemplo.
- Create `apps/web/src/lib/agenda.ts` e `agenda.test.ts`: helpers de agenda no web.
- Modify `apps/web/src/lib/permissions.ts` e `permissions.test.ts`: recepção acessa `/dashboard/aulas`.
- Modify `apps/web/src/components/Sidebar.tsx` e `MemberSidebar.tsx`: item "Aulas".
- Create `apps/web/src/app/membro/aulas/page.tsx`: agenda do aluno.
- Create `apps/web/src/components/ClassScheduleManager.tsx`: CRUD de turmas (admin).
- Create `apps/web/src/app/dashboard/aulas/page.tsx`: agenda da equipe.

---

### Task 1: Regras puras de aulas

**Files:**
- Create: `apps/api/src/lib/classes.ts`
- Test: `apps/api/src/lib/classes.test.ts`

**Interfaces:**
- Produces (usado pelas rotas na Task 3):
  - `formatLocalDate(date: Date): string`
  - `getStartsAt(date: string, startTime: string): Date`
  - `getUpcomingOccurrences(schedules: ScheduleInput[], from: Date, days: number): Occurrence[]`
  - `checkBooking(input: BookingCheckInput): BookingCheck`
  - `canCancelBooking(input: CancelInput): boolean`
  - tipos `ScheduleInput`, `Occurrence`, `BookingRefusal`, `BookingCheck`

- [ ] **Step 1: Write the failing tests**

Criar `apps/api/src/lib/classes.test.ts`:

```ts
import { describe, expect, test } from 'vitest'
import {
  canCancelBooking,
  checkBooking,
  formatLocalDate,
  getStartsAt,
  getUpcomingOccurrences,
} from './classes'

const sunday = new Date(2026, 8, 20, 12, 0) // domingo, 20/09/2026

describe('formatLocalDate', () => {
  test('formata a data local como YYYY-MM-DD com zeros à esquerda', () => {
    expect(formatLocalDate(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('getStartsAt', () => {
  test('combina a data e o horário em um Date local', () => {
    expect(getStartsAt('2026-09-22', '07:30')).toEqual(new Date(2026, 8, 22, 7, 30))
  })
})

describe('getUpcomingOccurrences', () => {
  const tuesday = { id: 's1', weekday: 2, startTime: '07:00', isActive: true }

  test('gera a aula no dia da semana certo dentro da janela', () => {
    expect(getUpcomingOccurrences([tuesday], sunday, 7)).toEqual([
      { scheduleId: 's1', date: '2026-09-22', startsAt: new Date(2026, 8, 22, 7, 0) },
    ])
  })

  test('inclui o dia de hoje e exclui o mesmo dia da semana seguinte', () => {
    const sundayClass = { id: 's2', weekday: 0, startTime: '18:00', isActive: true }
    const result = getUpcomingOccurrences([sundayClass], sunday, 7)
    expect(result.map((o) => o.date)).toEqual(['2026-09-20'])
  })

  test('repete a aula a cada semana quando a janela é maior', () => {
    const result = getUpcomingOccurrences([tuesday], sunday, 14)
    expect(result.map((o) => o.date)).toEqual(['2026-09-22', '2026-09-29'])
  })

  test('ignora turmas inativas', () => {
    expect(getUpcomingOccurrences([{ ...tuesday, isActive: false }], sunday, 7)).toEqual([])
  })

  test('ordena as ocorrências por horário de início', () => {
    const mondayEvening = { id: 's3', weekday: 1, startTime: '18:00', isActive: true }
    const tuesdayMorning = { id: 's4', weekday: 2, startTime: '09:00', isActive: true }
    const result = getUpcomingOccurrences([tuesdayMorning, mondayEvening], sunday, 7)
    expect(result.map((o) => o.scheduleId)).toEqual(['s3', 's4'])
  })
})

describe('checkBooking', () => {
  const now = new Date(2026, 8, 20, 12, 0)
  const base = {
    capacity: 10,
    bookedCount: 3,
    alreadyBooked: false,
    hasActiveSubscription: true,
    startsAt: new Date(2026, 8, 22, 7, 0),
    now,
  }

  test('aceita quando há vaga, assinatura ativa e a aula ainda não começou', () => {
    expect(checkBooking(base)).toEqual({ ok: true })
  })

  test('recusa com FULL quando a capacidade foi atingida', () => {
    expect(checkBooking({ ...base, bookedCount: 10 })).toEqual({ ok: false, reason: 'FULL' })
  })

  test('recusa com ALREADY_BOOKED quando o aluno já reservou', () => {
    expect(checkBooking({ ...base, alreadyBooked: true })).toEqual({ ok: false, reason: 'ALREADY_BOOKED' })
  })

  test('recusa com NO_ACTIVE_SUBSCRIPTION quando não há assinatura ativa', () => {
    expect(checkBooking({ ...base, hasActiveSubscription: false })).toEqual({
      ok: false,
      reason: 'NO_ACTIVE_SUBSCRIPTION',
    })
  })

  test('recusa com ALREADY_STARTED quando a aula já começou', () => {
    expect(checkBooking({ ...base, startsAt: new Date(2026, 8, 20, 11, 0) })).toEqual({
      ok: false,
      reason: 'ALREADY_STARTED',
    })
  })

  test('informa ALREADY_BOOKED antes de FULL quando as duas condições valem', () => {
    expect(checkBooking({ ...base, bookedCount: 10, alreadyBooked: true })).toEqual({
      ok: false,
      reason: 'ALREADY_BOOKED',
    })
  })
})

describe('canCancelBooking', () => {
  const now = new Date(2026, 8, 20, 12, 0)
  const future = new Date(2026, 8, 22, 7, 0)
  const past = new Date(2026, 8, 20, 11, 0)

  test('o dono cancela antes do início da aula', () => {
    expect(canCancelBooking({ isOwner: true, isStaff: false, startsAt: future, now })).toBe(true)
  })

  test('o dono não cancela depois que a aula começou', () => {
    expect(canCancelBooking({ isOwner: true, isStaff: false, startsAt: past, now })).toBe(false)
  })

  test('a equipe cancela mesmo depois que a aula começou', () => {
    expect(canCancelBooking({ isOwner: false, isStaff: true, startsAt: past, now })).toBe(true)
  })

  test('quem não é dono nem equipe não cancela', () => {
    expect(canCancelBooking({ isOwner: false, isStaff: false, startsAt: future, now })).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run (PowerShell): `Set-Location "C:\Users\user\OneDrive\Documentos\TCC-Sebastião\apps\api"; npx vitest run src\lib\classes.test.ts`
Expected: FAIL com `Cannot find module './classes'`.

- [ ] **Step 3: Write the implementation**

Criar `apps/api/src/lib/classes.ts`:

```ts
export interface ScheduleInput {
  id: string
  weekday: number
  startTime: string
  isActive: boolean
}

export interface Occurrence {
  scheduleId: string
  date: string
  startsAt: Date
}

export type BookingRefusal = 'FULL' | 'ALREADY_BOOKED' | 'NO_ACTIVE_SUBSCRIPTION' | 'ALREADY_STARTED'

export type BookingCheck = { ok: true } | { ok: false; reason: BookingRefusal }

export interface BookingCheckInput {
  capacity: number
  bookedCount: number
  alreadyBooked: boolean
  hasActiveSubscription: boolean
  startsAt: Date
  now: Date
}

export interface CancelInput {
  isOwner: boolean
  isStaff: boolean
  startsAt: Date
  now: Date
}

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getStartsAt(date: string, startTime: string): Date {
  const [year, month, day] = date.split('-').map(Number)
  const [hours, minutes] = startTime.split(':').map(Number)
  return new Date(year, month - 1, day, hours, minutes)
}

export function getUpcomingOccurrences(schedules: ScheduleInput[], from: Date, days: number): Occurrence[] {
  const occurrences: Occurrence[] = []

  for (let offset = 0; offset < days; offset++) {
    const day = new Date(from.getFullYear(), from.getMonth(), from.getDate() + offset)
    const date = formatLocalDate(day)

    for (const schedule of schedules) {
      if (!schedule.isActive || schedule.weekday !== day.getDay()) continue
      occurrences.push({
        scheduleId: schedule.id,
        date,
        startsAt: getStartsAt(date, schedule.startTime),
      })
    }
  }

  return occurrences.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
}

export function checkBooking(input: BookingCheckInput): BookingCheck {
  if (input.startsAt <= input.now) return { ok: false, reason: 'ALREADY_STARTED' }
  if (input.alreadyBooked) return { ok: false, reason: 'ALREADY_BOOKED' }
  if (!input.hasActiveSubscription) return { ok: false, reason: 'NO_ACTIVE_SUBSCRIPTION' }
  if (input.bookedCount >= input.capacity) return { ok: false, reason: 'FULL' }
  return { ok: true }
}

export function canCancelBooking(input: CancelInput): boolean {
  if (input.isStaff) return true
  return input.isOwner && input.startsAt > input.now
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src\lib\classes.test.ts`
Expected: PASS, 17 testes.

- [ ] **Step 5: Verify the whole API suite and types**

Run: `npx vitest run; npx tsc --noEmit`
Expected: todos os testes passam, `tsc` sem saída.

---

### Task 2: Schema Prisma e tipos compartilhados

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Modify: `packages/shared/src/types.ts`

**Interfaces:**
- Produces (usado nas Tasks 3 a 6):
  - Prisma: `prisma.classSchedule`, `prisma.classBooking`, enum `BookingStatus` (`BOOKED` | `CANCELLED`); chave única composta `scheduleId_userId_classDate`.
  - Shared: `ClassSchedule` e `AgendaItem` (campos abaixo).

- [ ] **Step 1: Add the enum and models to the Prisma schema**

Em `apps/api/prisma/schema.prisma`, depois do `enum NotificationType`, adicionar:

```prisma
enum BookingStatus {
  BOOKED
  CANCELLED
}
```

Depois do `model PhysicalAssessment`, adicionar:

```prisma
model ClassSchedule {
  id              String   @id @default(cuid())
  name            String
  description     String?
  instructorId    String
  weekday         Int
  startTime       String
  durationMinutes Int
  capacity        Int
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  instructor User           @relation("ClassInstructor", fields: [instructorId], references: [id])
  bookings   ClassBooking[]
}

model ClassBooking {
  id         String        @id @default(cuid())
  scheduleId String
  userId     String
  bookedById String
  classDate  String
  status     BookingStatus @default(BOOKED)
  createdAt  DateTime      @default(now())

  schedule ClassSchedule @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
  user     User          @relation("ClassBookingStudent", fields: [userId], references: [id])
  bookedBy User          @relation("ClassBookingCreator", fields: [bookedById], references: [id])

  @@unique([scheduleId, userId, classDate])
}
```

No `model User`, logo abaixo de `physicalAssessments PhysicalAssessment[]`, adicionar:

```prisma
  taughtClasses         ClassSchedule[]      @relation("ClassInstructor")
  classBookings         ClassBooking[]       @relation("ClassBookingStudent")
  classBookingsCreated  ClassBooking[]       @relation("ClassBookingCreator")
```

- [ ] **Step 2: Validate and regenerate the client**

Run: `Set-Location "C:\Users\user\OneDrive\Documentos\TCC-Sebastião\apps\api"; npx prisma validate; npx prisma generate`
Expected: `The schema at prisma\schema.prisma is valid` e `Generated Prisma Client`. Não rodar `migrate`.

- [ ] **Step 3: Add the shared types**

Em `packages/shared/src/types.ts`, antes de `// --- Plan ---`, adicionar:

```ts
// --- Classes ---

export interface ClassSchedule {
  id: string
  name: string
  description: string | null
  instructorId: string
  instructor?: { id: string; name: string }
  weekday: number
  startTime: string
  durationMinutes: number
  capacity: number
  isActive: boolean
}

export interface AgendaItem {
  scheduleId: string
  name: string
  description: string | null
  instructor: { id: string; name: string }
  date: string
  startsAt: string
  durationMinutes: number
  capacity: number
  bookedCount: number
  spotsLeft: number
  bookedByMe: boolean
  myBookingId: string | null
  bookings?: { id: string; userId: string; userName: string }[]
}
```

- [ ] **Step 4: Typecheck both apps**

Run: `npx tsc --noEmit` em `apps/api`, depois `Set-Location "C:\Users\user\OneDrive\Documentos\TCC-Sebastião\apps\web"; npx tsc --noEmit`
Expected: sem saída nos dois.

---

### Task 3: Rotas `/classes`

**Files:**
- Create: `apps/api/src/routes/classes.ts`
- Modify: `apps/api/src/server.ts`
- Modify: `apps/api/src/seed.ts`

**Interfaces:**
- Consumes: `getUpcomingOccurrences`, `getStartsAt`, `checkBooking`, `canCancelBooking` (Task 1); `prisma.classSchedule`, `prisma.classBooking` e a chave `scheduleId_userId_classDate` (Task 2); `authenticate`, `requireAdmin` de `../middleware/auth`.
- Produces (consumido pelo web, Tasks 5 e 6):
  - `GET /classes` (admin) → `ClassSchedule[]` com `instructor`
  - `POST /classes`, `PUT /classes/:id`, `DELETE /classes/:id` (admin)
  - `GET /classes/agenda?days=1..7` → `AgendaItem[]`
  - `POST /classes/:id/bookings` body `{ date: string, userId?: string }` → 201 com a reserva
  - `DELETE /classes/bookings/:bookingId` → a reserva com `status: 'CANCELLED'`
  - Erros: `{ message: string }` em português, status 400/403/404/409.

- [ ] **Step 1: Write the routes**

Criar `apps/api/src/routes/classes.ts`:

```ts
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate, requireAdmin } from '../middleware/auth'
import {
  BookingRefusal,
  canCancelBooking,
  checkBooking,
  getStartsAt,
  getUpcomingOccurrences,
} from '../lib/classes'

const BOOKING_WINDOW_DAYS = 7

const REFUSAL_MESSAGES: Record<BookingRefusal, string> = {
  FULL: 'Essa aula está lotada',
  ALREADY_BOOKED: 'Já existe uma reserva desse aluno nessa aula',
  NO_ACTIVE_SUBSCRIPTION: 'O aluno precisa de uma assinatura ativa para reservar',
  ALREADY_STARTED: 'Essa aula já começou',
}

const scheduleSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  instructorId: z.string(),
  weekday: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  durationMinutes: z.number().int().positive(),
  capacity: z.number().int().positive(),
  isActive: z.boolean().optional(),
})

const isStaff = (role: string) => role === 'ADMIN' || role === 'RECEPTIONIST'

async function isTrainer(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
  return user?.role === 'PERSONAL_TRAINER'
}

export async function classesRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: requireAdmin }, async () => {
    return prisma.classSchedule.findMany({
      include: { instructor: { select: { id: true, name: true } } },
      orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
    })
  })

  app.post('/', { preHandler: requireAdmin }, async (req, reply) => {
    const data = scheduleSchema.parse(req.body)
    if (!(await isTrainer(data.instructorId))) {
      return reply.status(400).send({ message: 'O instrutor precisa ser um personal trainer cadastrado' })
    }

    const schedule = await prisma.classSchedule.create({
      data,
      include: { instructor: { select: { id: true, name: true } } },
    })
    return reply.status(201).send(schedule)
  })

  app.put('/:id', { preHandler: requireAdmin }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const data = scheduleSchema.parse(req.body)
    if (!(await isTrainer(data.instructorId))) {
      return reply.status(400).send({ message: 'O instrutor precisa ser um personal trainer cadastrado' })
    }

    const existing = await prisma.classSchedule.findUnique({ where: { id } })
    if (!existing) return reply.status(404).send({ message: 'Turma não encontrada' })

    return prisma.classSchedule.update({
      where: { id },
      data,
      include: { instructor: { select: { id: true, name: true } } },
    })
  })

  app.delete('/:id', { preHandler: requireAdmin }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const existing = await prisma.classSchedule.findUnique({ where: { id } })
    if (!existing) return reply.status(404).send({ message: 'Turma não encontrada' })

    await prisma.classSchedule.delete({ where: { id } })
    return reply.status(204).send()
  })

  app.get('/agenda', { preHandler: authenticate }, async (req) => {
    const { days = String(BOOKING_WINDOW_DAYS) } = req.query as Record<string, string>
    const windowDays = Math.min(Math.max(Number(days) || BOOKING_WINDOW_DAYS, 1), BOOKING_WINDOW_DAYS)
    const jwtUser = req.user as { id: string; role: string }

    const schedules = await prisma.classSchedule.findMany({
      where: { isActive: true },
      include: { instructor: { select: { id: true, name: true } } },
    })

    const occurrences = getUpcomingOccurrences(schedules, new Date(), windowDays)
    const dates = [...new Set(occurrences.map((o) => o.date))]

    const bookings = await prisma.classBooking.findMany({
      where: { status: 'BOOKED', classDate: { in: dates }, scheduleId: { in: schedules.map((s) => s.id) } },
      include: { user: { select: { name: true } } },
    })

    return occurrences.map((occurrence) => {
      const schedule = schedules.find((s) => s.id === occurrence.scheduleId)!
      const booked = bookings.filter(
        (b) => b.scheduleId === occurrence.scheduleId && b.classDate === occurrence.date,
      )
      const mine = booked.find((b) => b.userId === jwtUser.id)

      return {
        scheduleId: schedule.id,
        name: schedule.name,
        description: schedule.description,
        instructor: schedule.instructor,
        date: occurrence.date,
        startsAt: occurrence.startsAt.toISOString(),
        durationMinutes: schedule.durationMinutes,
        capacity: schedule.capacity,
        bookedCount: booked.length,
        spotsLeft: Math.max(schedule.capacity - booked.length, 0),
        bookedByMe: Boolean(mine),
        myBookingId: mine?.id ?? null,
        ...(isStaff(jwtUser.role)
          ? { bookings: booked.map((b) => ({ id: b.id, userId: b.userId, userName: b.user.name })) }
          : {}),
      }
    })
  })

  app.post('/:id/bookings', { preHandler: authenticate }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const jwtUser = req.user as { id: string; role: string }
    const { date, userId } = z
      .object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), userId: z.string().optional() })
      .parse(req.body)

    if (userId && userId !== jwtUser.id && !isStaff(jwtUser.role)) {
      return reply.status(403).send({ message: 'Acesso negado' })
    }
    const studentId = userId ?? jwtUser.id

    const student = await prisma.user.findUnique({ where: { id: studentId }, select: { id: true } })
    if (!student) return reply.status(404).send({ message: 'Aluno não encontrado' })

    const schedule = await prisma.classSchedule.findUnique({ where: { id } })
    if (!schedule || !schedule.isActive) return reply.status(404).send({ message: 'Turma não encontrada' })

    const now = new Date()
    const occurrence = getUpcomingOccurrences([schedule], now, BOOKING_WINDOW_DAYS).find((o) => o.date === date)
    if (!occurrence) {
      return reply.status(400).send({ message: 'Essa aula não acontece na data informada ou está fora da janela de reserva' })
    }

    const uniqueKey = { scheduleId_userId_classDate: { scheduleId: id, userId: studentId, classDate: date } }
    const [bookedCount, existing, activeSubscription] = await Promise.all([
      prisma.classBooking.count({ where: { scheduleId: id, classDate: date, status: 'BOOKED' } }),
      prisma.classBooking.findUnique({ where: uniqueKey }),
      prisma.subscription.findFirst({ where: { userId: studentId, status: 'ACTIVE' } }),
    ])

    const check = checkBooking({
      capacity: schedule.capacity,
      bookedCount,
      alreadyBooked: existing?.status === 'BOOKED',
      hasActiveSubscription: Boolean(activeSubscription),
      startsAt: occurrence.startsAt,
      now,
    })
    if (!check.ok) return reply.status(409).send({ message: REFUSAL_MESSAGES[check.reason] })

    const booking = await prisma.classBooking.upsert({
      where: uniqueKey,
      create: { scheduleId: id, userId: studentId, bookedById: jwtUser.id, classDate: date },
      update: { status: 'BOOKED', bookedById: jwtUser.id },
    })
    return reply.status(201).send(booking)
  })

  app.delete('/bookings/:bookingId', { preHandler: authenticate }, async (req, reply) => {
    const { bookingId } = req.params as { bookingId: string }
    const jwtUser = req.user as { id: string; role: string }

    const booking = await prisma.classBooking.findUnique({
      where: { id: bookingId },
      include: { schedule: true },
    })
    if (!booking || booking.status !== 'BOOKED') {
      return reply.status(404).send({ message: 'Reserva não encontrada' })
    }

    const isOwner = booking.userId === jwtUser.id
    if (!isOwner && !isStaff(jwtUser.role)) return reply.status(403).send({ message: 'Acesso negado' })

    const allowed = canCancelBooking({
      isOwner,
      isStaff: isStaff(jwtUser.role),
      startsAt: getStartsAt(booking.classDate, booking.schedule.startTime),
      now: new Date(),
    })
    if (!allowed) return reply.status(409).send({ message: 'Essa aula já começou e não pode mais ser cancelada' })

    return prisma.classBooking.update({ where: { id: bookingId }, data: { status: 'CANCELLED' } })
  })
}
```

- [ ] **Step 2: Register the routes**

Em `apps/api/src/server.ts`, junto aos outros imports de rotas, adicionar:

```ts
import { classesRoutes } from './routes/classes'
```

E depois de `app.register(billingRoutes, { prefix: '/billing' })`:

```ts
app.register(classesRoutes, { prefix: '/classes' })
```

- [ ] **Step 3: Add sample classes to the seed**

Em `apps/api/src/seed.ts`, depois do bloco `// Treino personalizado de exemplo` (o `prisma.personalWorkout.upsert`) e antes dos `console.log` finais, adicionar:

```ts
  // Turmas de exemplo
  const classSchedules = [
    { id: 'class-spinning-ter', name: 'Spinning', weekday: 2, startTime: '07:00', durationMinutes: 45, capacity: 15 },
    { id: 'class-spinning-qui', name: 'Spinning', weekday: 4, startTime: '07:00', durationMinutes: 45, capacity: 15 },
    { id: 'class-funcional-seg', name: 'Funcional', weekday: 1, startTime: '18:30', durationMinutes: 50, capacity: 12 },
  ]

  for (const schedule of classSchedules) {
    await prisma.classSchedule.upsert({
      where: { id: schedule.id },
      update: {},
      create: { ...schedule, instructorId: trainer.id },
    })
  }
```

- [ ] **Step 4: Typecheck and run the suite**

Run: `Set-Location "C:\Users\user\OneDrive\Documentos\TCC-Sebastião\apps\api"; npx tsc --noEmit; npx vitest run`
Expected: `tsc` sem saída; todos os testes passam.

- [ ] **Step 5: Record what could not be verified**

As rotas não foram exercitadas contra um banco (sem Postgres). No relatório final da tarefa, dizer isso e listar o roteiro manual para quando houver banco: rodar `npx prisma migrate dev` e `npx prisma db seed`, entrar como `ana@gymtech.com` e reservar para `joao@exemplo.com`, tentar reservar duas vezes (409), lotar uma turma (409) e cancelar.

---

### Task 4: Helpers do web, permissão da recepção e menus

**Files:**
- Create: `apps/web/src/lib/agenda.ts`
- Test: `apps/web/src/lib/agenda.test.ts`
- Modify: `apps/web/src/lib/permissions.ts`
- Test: `apps/web/src/lib/permissions.test.ts`
- Modify: `apps/web/src/components/Sidebar.tsx`
- Modify: `apps/web/src/components/MemberSidebar.tsx`

**Interfaces:**
- Consumes: `AgendaItem` de `@academia/shared` (Task 2).
- Produces (usado nas Tasks 5 e 6):
  - `groupAgendaByDate(items: AgendaItem[]): { date: string; items: AgendaItem[] }[]` (espera a lista ordenada por horário, como a API devolve)
  - `getErrorMessage(err: unknown): string`
  - `formatAgendaDate(date: string): string`, `formatTime(iso: string): string`
  - `WEEKDAY_LABELS: string[]` (índice 0 = Domingo)

- [ ] **Step 1: Write the failing tests**

Criar `apps/web/src/lib/agenda.test.ts`:

```ts
import { describe, expect, test } from 'vitest'
import type { AgendaItem } from '@academia/shared'
import { getErrorMessage, groupAgendaByDate } from './agenda'

function item(scheduleId: string, date: string): AgendaItem {
  return {
    scheduleId,
    name: 'Spinning',
    description: null,
    instructor: { id: 'i1', name: 'Carlos' },
    date,
    startsAt: `${date}T10:00:00.000Z`,
    durationMinutes: 45,
    capacity: 10,
    bookedCount: 0,
    spotsLeft: 10,
    bookedByMe: false,
    myBookingId: null,
  }
}

describe('groupAgendaByDate', () => {
  test('agrupa aulas consecutivas da mesma data preservando a ordem', () => {
    const groups = groupAgendaByDate([
      item('a', '2026-09-21'),
      item('b', '2026-09-21'),
      item('c', '2026-09-22'),
    ])

    expect(groups.map((g) => g.date)).toEqual(['2026-09-21', '2026-09-22'])
    expect(groups[0].items.map((i) => i.scheduleId)).toEqual(['a', 'b'])
    expect(groups[1].items.map((i) => i.scheduleId)).toEqual(['c'])
  })

  test('devolve lista vazia quando não há aulas', () => {
    expect(groupAgendaByDate([])).toEqual([])
  })
})

describe('getErrorMessage', () => {
  test('usa a mensagem que veio da API', () => {
    expect(getErrorMessage({ response: { data: { message: 'Essa aula está lotada' } } })).toBe('Essa aula está lotada')
  })

  test('usa a mensagem padrão quando o erro não tem resposta da API', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('Não foi possível concluir a ação. Tente novamente.')
  })
})
```

Em `apps/web/src/lib/permissions.test.ts`, dentro do `describe('canAccessDashboardPath', ...)`, depois do teste de `/dashboard/alunos`, adicionar:

```ts
  test('recepção pode acessar a agenda de aulas', () => {
    expect(canAccessDashboardPath('RECEPTIONIST', '/dashboard/aulas')).toBe(true)
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `Set-Location "C:\Users\user\OneDrive\Documentos\TCC-Sebastião\apps\web"; npx vitest run`
Expected: FAIL em `agenda.test.ts` (`Cannot find module './agenda'`) e no teste novo de `permissions.test.ts` (recebeu `false`).

- [ ] **Step 3: Write `agenda.ts`**

Criar `apps/web/src/lib/agenda.ts`:

```ts
import type { AgendaItem } from '@academia/shared'

export const WEEKDAY_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export function groupAgendaByDate(items: AgendaItem[]): { date: string; items: AgendaItem[] }[] {
  const groups: { date: string; items: AgendaItem[] }[] = []

  for (const item of items) {
    const last = groups[groups.length - 1]
    if (last && last.date === item.date) last.items.push(item)
    else groups.push({ date: item.date, items: [item] })
  }

  return groups
}

export function getErrorMessage(err: unknown): string {
  const message = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message
  return typeof message === 'string' ? message : 'Não foi possível concluir a ação. Tente novamente.'
}

export function formatAgendaDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
```

- [ ] **Step 4: Allow the receptionist on the agenda page**

Em `apps/web/src/lib/permissions.ts`, trocar a constante por:

```ts
const RECEPTIONIST_ALLOWED_PREFIXES = [
  '/dashboard/alunos',
  '/dashboard/assinaturas',
  '/dashboard/pagamentos',
  '/dashboard/aulas',
]
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run`
Expected: PASS em `agenda.test.ts` (4 testes) e `permissions.test.ts` (5 testes).

- [ ] **Step 6: Add the menu items**

Em `apps/web/src/components/Sidebar.tsx`, adicionar `CalendarDays` ao import de `lucide-react` e o item "Aulas" depois de "Assinaturas":

```tsx
import {
  LayoutDashboard, Users, CreditCard, Dumbbell,
  FileText, LogOut, Settings, ClipboardList, ChevronRight, Bell, CalendarDays,
} from 'lucide-react'
```

```tsx
  { label: 'Assinaturas', href: '/dashboard/assinaturas', icon: CreditCard },
  { label: 'Aulas', href: '/dashboard/aulas', icon: CalendarDays },
```

Em `apps/web/src/components/MemberSidebar.tsx`, adicionar `CalendarDays` ao import de `lucide-react` e o item depois de "Treinos":

```tsx
import { ClipboardList, CreditCard, Dumbbell, FileText, LogOut, Settings, Home, ChevronRight, CalendarDays } from 'lucide-react'
```

```tsx
  { label: 'Treinos', href: '/membro/treinos', icon: Dumbbell },
  { label: 'Aulas', href: '/membro/aulas', icon: CalendarDays },
```

- [ ] **Step 7: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem saída.

---

### Task 5: Página de aulas do aluno

**Files:**
- Create: `apps/web/src/app/membro/aulas/page.tsx`

**Interfaces:**
- Consumes: `AgendaItem` (Task 2); `groupAgendaByDate`, `getErrorMessage`, `formatAgendaDate`, `formatTime` (Task 4); `GET /classes/agenda`, `POST /classes/:id/bookings`, `DELETE /classes/bookings/:bookingId` (Task 3); `api` de `@/lib/api`.

- [ ] **Step 1: Write the page**

Criar `apps/web/src/app/membro/aulas/page.tsx`:

```tsx
'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { AgendaItem } from '@academia/shared'
import { CalendarDays, Clock, User } from 'lucide-react'
import { formatAgendaDate, formatTime, getErrorMessage, groupAgendaByDate } from '@/lib/agenda'

export default function AulasMembroPage() {
  const queryClient = useQueryClient()

  const { data: agenda = [], isLoading } = useQuery<AgendaItem[]>({
    queryKey: ['agenda'],
    queryFn: () => api.get('/classes/agenda').then((r) => r.data),
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['agenda'] })

  const book = useMutation({
    mutationFn: (item: AgendaItem) => api.post(`/classes/${item.scheduleId}/bookings`, { date: item.date }),
    onSuccess: refresh,
  })

  const cancel = useMutation({
    mutationFn: (bookingId: string) => api.delete(`/classes/bookings/${bookingId}`),
    onSuccess: refresh,
  })

  const error = book.error ?? cancel.error
  const groups = groupAgendaByDate(agenda)

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Aulas</h1>
        <p className="page-subtitle">Reserve sua vaga nas aulas dos próximos 7 dias</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
          {getErrorMessage(error)}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center p-16 text-gray-400 text-sm">Carregando...</div>
      ) : groups.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center">
          <CalendarDays size={48} className="text-gray-200 mb-4" />
          <p className="text-gray-500 font-medium">Nenhuma aula nos próximos 7 dias.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.date}>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                {formatAgendaDate(group.date)}
              </h2>
              <div className="grid grid-cols-2 gap-5">
                {group.items.map((item) => {
                  const started = new Date(item.startsAt) <= new Date()
                  const full = item.spotsLeft === 0
                  return (
                    <div key={`${item.scheduleId}-${item.date}`} className="card flex flex-col">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="font-bold text-gray-900">{item.name}</h3>
                        <span className="text-xs font-semibold text-gray-500 flex-shrink-0">
                          {item.spotsLeft} de {item.capacity} vagas
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                        <span className="flex items-center gap-1.5">
                          <Clock size={13} />
                          {formatTime(item.startsAt)} · {item.durationMinutes} min
                        </span>
                        <span className="flex items-center gap-1.5">
                          <User size={13} />
                          {item.instructor.name}
                        </span>
                      </div>
                      {item.bookedByMe ? (
                        <button
                          onClick={() => item.myBookingId && cancel.mutate(item.myBookingId)}
                          disabled={started || cancel.isPending}
                          className="btn-secondary w-full text-sm"
                        >
                          Cancelar reserva
                        </button>
                      ) : (
                        <button
                          onClick={() => book.mutate(item)}
                          disabled={started || full || book.isPending}
                          className="btn-primary w-full text-sm"
                        >
                          {started ? 'Aula encerrada' : full ? 'Aula lotada' : 'Reservar vaga'}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `Set-Location "C:\Users\user\OneDrive\Documentos\TCC-Sebastião\apps\web"; npx tsc --noEmit`
Expected: sem saída.

- [ ] **Step 3: Record what could not be verified**

A página não foi vista no navegador nem exercitada contra a API (sem banco). Dizer isso no relatório da tarefa.

---

### Task 6: Agenda da equipe e gerenciador de turmas

**Files:**
- Create: `apps/web/src/components/ClassScheduleManager.tsx`
- Create: `apps/web/src/app/dashboard/aulas/page.tsx`

**Interfaces:**
- Consumes: `AgendaItem`, `ClassSchedule` (Task 2); `groupAgendaByDate`, `getErrorMessage`, `formatAgendaDate`, `formatTime`, `WEEKDAY_LABELS` (Task 4); `GET/POST/PUT/DELETE /classes`, `/classes/agenda`, `/classes/:id/bookings`, `/classes/bookings/:bookingId` (Task 3); `GET /users?search=&perPage=` (existente, `requireStaff`, devolve `{ data: User[] }`); `useAuth().isAdmin` de `@/contexts/AuthContext`.
- Produces: `ClassScheduleManager` (sem props), usado só pela página.

- [ ] **Step 1: Write the schedule manager (admin)**

Criar `apps/web/src/components/ClassScheduleManager.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { ClassSchedule, User } from '@academia/shared'
import { WEEKDAY_LABELS, getErrorMessage } from '@/lib/agenda'

interface FormState {
  name: string
  instructorId: string
  weekday: string
  startTime: string
  durationMinutes: string
  capacity: string
}

const EMPTY_FORM: FormState = {
  name: '',
  instructorId: '',
  weekday: '1',
  startTime: '07:00',
  durationMinutes: '45',
  capacity: '15',
}

export function ClassScheduleManager() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)

  const { data: schedules = [] } = useQuery<ClassSchedule[]>({
    queryKey: ['class-schedules'],
    queryFn: () => api.get('/classes').then((r) => r.data),
  })

  const { data: trainers = [] } = useQuery<User[]>({
    queryKey: ['trainers'],
    queryFn: () =>
      api.get('/users', { params: { perPage: 100 } }).then((r) =>
        (r.data.data as User[]).filter((u) => u.role === 'PERSONAL_TRAINER'),
      ),
  })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['class-schedules'] })
    queryClient.invalidateQueries({ queryKey: ['agenda'] })
  }

  const save = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      editingId ? api.put(`/classes/${editingId}`, payload) : api.post('/classes', payload),
    onSuccess: () => {
      refresh()
      setForm(EMPTY_FORM)
      setEditingId(null)
    },
  })

  const toggleActive = useMutation({
    mutationFn: (schedule: ClassSchedule) =>
      api.put(`/classes/${schedule.id}`, {
        name: schedule.name,
        description: schedule.description ?? undefined,
        instructorId: schedule.instructorId,
        weekday: schedule.weekday,
        startTime: schedule.startTime,
        durationMinutes: schedule.durationMinutes,
        capacity: schedule.capacity,
        isActive: !schedule.isActive,
      }),
    onSuccess: refresh,
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/classes/${id}`),
    onSuccess: refresh,
  })

  const startEditing = (schedule: ClassSchedule) => {
    setEditingId(schedule.id)
    setForm({
      name: schedule.name,
      instructorId: schedule.instructorId,
      weekday: String(schedule.weekday),
      startTime: schedule.startTime,
      durationMinutes: String(schedule.durationMinutes),
      capacity: String(schedule.capacity),
    })
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    save.mutate({
      name: form.name,
      instructorId: form.instructorId,
      weekday: Number(form.weekday),
      startTime: form.startTime,
      durationMinutes: Number(form.durationMinutes),
      capacity: Number(form.capacity),
    })
  }

  const error = save.error ?? toggleActive.error ?? remove.error

  return (
    <div className="card">
      <div className="mb-6">
        <h2 className="font-bold text-gray-900">Turmas</h2>
        <p className="text-xs text-gray-400 mt-0.5">Horário semanal recorrente de cada aula</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
          {getErrorMessage(error)}
        </div>
      )}

      <form onSubmit={submit} className="grid grid-cols-3 gap-3 mb-6 p-4 bg-gray-50 rounded-xl">
        <input required className="input" placeholder="Nome da aula" value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <select required className="input" value={form.instructorId}
          onChange={(e) => setForm({ ...form, instructorId: e.target.value })}>
          <option value="">Instrutor</option>
          {trainers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select className="input" value={form.weekday}
          onChange={(e) => setForm({ ...form, weekday: e.target.value })}>
          {WEEKDAY_LABELS.map((label, i) => <option key={label} value={i}>{label}</option>)}
        </select>
        <input required type="time" className="input" value={form.startTime}
          onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
        <input required type="number" min="1" className="input" placeholder="Duração (min)" value={form.durationMinutes}
          onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} />
        <input required type="number" min="1" className="input" placeholder="Capacidade" value={form.capacity}
          onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
        <div className="col-span-3 flex gap-2">
          <button type="submit" disabled={save.isPending} className="btn-primary text-xs">
            {editingId ? 'Salvar alterações' : 'Criar turma'}
          </button>
          {editingId && (
            <button type="button" className="btn-secondary text-xs"
              onClick={() => { setEditingId(null); setForm(EMPTY_FORM) }}>
              Cancelar edição
            </button>
          )}
        </div>
      </form>

      <table className="w-full text-sm">
        <thead className="border-b border-gray-100">
          <tr>
            <th className="table-header">Aula</th>
            <th className="table-header">Dia</th>
            <th className="table-header">Horário</th>
            <th className="table-header">Instrutor</th>
            <th className="table-header">Vagas</th>
            <th className="table-header">Status</th>
            <th className="px-6 py-3.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {schedules.map((s) => (
            <tr key={s.id} className="table-row">
              <td className="px-6 py-3 font-semibold text-gray-900">{s.name}</td>
              <td className="px-6 py-3 text-gray-600">{WEEKDAY_LABELS[s.weekday]}</td>
              <td className="px-6 py-3 text-gray-600">{s.startTime} · {s.durationMinutes} min</td>
              <td className="px-6 py-3 text-gray-600">{s.instructor?.name}</td>
              <td className="px-6 py-3 text-gray-600">{s.capacity}</td>
              <td className="px-6 py-3">
                <span className={s.isActive ? 'badge-active' : 'badge-inactive'}>
                  {s.isActive ? 'Ativa' : 'Inativa'}
                </span>
              </td>
              <td className="px-6 py-3">
                <div className="flex gap-2 justify-end text-xs font-medium">
                  <button onClick={() => startEditing(s)} className="text-primary-600 hover:bg-primary-50 rounded-lg px-2 py-1">
                    Editar
                  </button>
                  <button onClick={() => toggleActive.mutate(s)} className="text-amber-600 hover:bg-amber-50 rounded-lg px-2 py-1">
                    {s.isActive ? 'Desativar' : 'Ativar'}
                  </button>
                  <button
                    onClick={() => { if (window.confirm(`Remover a turma ${s.name}? As reservas dela também serão apagadas.`)) remove.mutate(s.id) }}
                    className="text-red-600 hover:bg-red-50 rounded-lg px-2 py-1"
                  >
                    Remover
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Write the staff agenda page**

Criar `apps/web/src/app/dashboard/aulas/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { AgendaItem, User } from '@academia/shared'
import { Search, X } from 'lucide-react'
import { ClassScheduleManager } from '@/components/ClassScheduleManager'
import { formatAgendaDate, formatTime, getErrorMessage, groupAgendaByDate } from '@/lib/agenda'

export default function AulasPage() {
  const { isAdmin } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [student, setStudent] = useState<User | null>(null)

  const { data: agenda = [], isLoading } = useQuery<AgendaItem[]>({
    queryKey: ['agenda'],
    queryFn: () => api.get('/classes/agenda').then((r) => r.data),
  })

  const { data: matches = [] } = useQuery<User[]>({
    queryKey: ['student-search', search],
    enabled: search.length >= 2,
    queryFn: () =>
      api.get('/users', { params: { search, perPage: 8 } }).then((r) =>
        (r.data.data as User[]).filter((u) => u.role === 'MEMBER'),
      ),
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['agenda'] })

  const book = useMutation({
    mutationFn: (item: AgendaItem) =>
      api.post(`/classes/${item.scheduleId}/bookings`, { date: item.date, userId: student?.id }),
    onSuccess: refresh,
  })

  const cancel = useMutation({
    mutationFn: (bookingId: string) => api.delete(`/classes/bookings/${bookingId}`),
    onSuccess: refresh,
  })

  const error = book.error ?? cancel.error
  const groups = groupAgendaByDate(agenda)

  return (
    <div>
      <div className="mb-8">
        <h1 className="page-title">Aulas</h1>
        <p className="page-subtitle">Agenda dos próximos 7 dias e reservas em nome dos alunos</p>
      </div>

      <div className="card mb-5">
        <p className="text-sm font-semibold text-gray-900 mb-3">Reservar para o aluno</p>
        {student ? (
          <div className="flex items-center justify-between bg-primary-50 rounded-xl px-4 py-2.5">
            <span className="text-sm font-semibold text-gray-900">{student.name}</span>
            <button onClick={() => setStudent(null)} className="text-gray-400 hover:text-gray-600" aria-label="Trocar aluno">
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-10" placeholder="Buscar aluno por nome ou e-mail..." value={search}
              onChange={(e) => setSearch(e.target.value)} />
            {matches.length > 0 && (
              <ul className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
                {matches.map((u) => (
                  <li key={u.id}>
                    <button className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50"
                      onClick={() => { setStudent(u); setSearch('') }}>
                      <span className="font-semibold text-gray-900">{u.name}</span>
                      <span className="text-gray-400 text-xs ml-2">{u.email}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm">
          {getErrorMessage(error)}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center p-16 text-gray-400 text-sm">Carregando...</div>
      ) : groups.length === 0 ? (
        <div className="card p-16 text-center text-gray-400 text-sm">Nenhuma aula nos próximos 7 dias.</div>
      ) : (
        <div className="space-y-8 mb-8">
          {groups.map((group) => (
            <section key={group.date}>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                {formatAgendaDate(group.date)}
              </h2>
              <div className="grid grid-cols-2 gap-5">
                {group.items.map((item) => {
                  const started = new Date(item.startsAt) <= new Date()
                  const full = item.spotsLeft === 0
                  return (
                    <div key={`${item.scheduleId}-${item.date}`} className="card flex flex-col">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <h3 className="font-bold text-gray-900">{item.name}</h3>
                        <span className="text-xs font-semibold text-gray-500 flex-shrink-0">
                          {item.bookedCount} / {item.capacity}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mb-4">
                        {formatTime(item.startsAt)} · {item.durationMinutes} min · {item.instructor.name}
                      </p>
                      <ul className="space-y-1.5 mb-4 flex-1">
                        {(item.bookings ?? []).map((b) => (
                          <li key={b.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 text-sm">
                            <span className="text-gray-600">{b.userName}</span>
                            <button onClick={() => cancel.mutate(b.id)} disabled={cancel.isPending}
                              className="text-xs text-red-600 hover:underline">
                              Cancelar
                            </button>
                          </li>
                        ))}
                        {(item.bookings ?? []).length === 0 && (
                          <li className="text-xs text-gray-400">Nenhuma reserva ainda.</li>
                        )}
                      </ul>
                      <button
                        onClick={() => book.mutate(item)}
                        disabled={!student || started || full || book.isPending}
                        className="btn-primary w-full text-sm"
                      >
                        {started ? 'Aula encerrada' : full ? 'Aula lotada' : student ? `Reservar para ${student.name}` : 'Escolha um aluno acima'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {isAdmin && <ClassScheduleManager />}
    </div>
  )
}
```

- [ ] **Step 3: Typecheck and run the web suite**

Run: `Set-Location "C:\Users\user\OneDrive\Documentos\TCC-Sebastião\apps\web"; npx tsc --noEmit; npx vitest run`
Expected: `tsc` sem saída; testes passam.

- [ ] **Step 4: Final verification across both apps**

Run: `npx vitest run` e `npx tsc --noEmit` em `apps/api` e em `apps/web`.
Expected: tudo verde.

- [ ] **Step 5: Report honestly**

No relatório final: o que foi testado automaticamente (regras puras, helpers do web, permissões) e o que não foi verificado (rotas contra banco e as duas páginas no navegador, por falta de Postgres). Limitação conhecida: duas reservas simultâneas na última vaga podem passar da capacidade, porque a contagem e a criação não estão numa transação serializável. Migração pendente para o usuário: `npx prisma migrate dev` e `npx prisma db seed` em `apps/api`.
