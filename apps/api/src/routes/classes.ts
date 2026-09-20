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
