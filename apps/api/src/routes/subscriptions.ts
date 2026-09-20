import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { addDays } from '../lib/dateUtils'
import { extendEndDateByFrozenDays } from '../lib/subscriptionFreeze'
import { prisma } from '../lib/prisma'
import { authenticate, requireStaff } from '../middleware/auth'

export async function subscriptionsRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: requireStaff }, async (req) => {
    const { page = '1', perPage = '20', status, search } = req.query as Record<string, string>

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }
    }

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true } }, plan: true },
        skip: (Number(page) - 1) * Number(perPage),
        take: Number(perPage),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.subscription.count({ where }),
    ])

    return { data: subscriptions, total, page: Number(page), perPage: Number(perPage), totalPages: Math.ceil(total / Number(perPage)) }
  })

  app.get('/:id', { preHandler: authenticate }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: { user: true, plan: true, payments: { orderBy: { createdAt: 'desc' } } },
    })
    if (!subscription) return reply.status(404).send({ message: 'Assinatura não encontrada' })
    return subscription
  })

  app.post('/', { preHandler: requireStaff }, async (req, reply) => {
    const schema = z.object({
      userId: z.string(),
      planId: z.string(),
      startDate: z.string().datetime().optional(),
    })

    const { userId, planId, startDate } = schema.parse(req.body)

    const plan = await prisma.plan.findUniqueOrThrow({ where: { id: planId } })

    const start = startDate ? new Date(startDate) : new Date()
    const end = addDays(start, plan.durationDays)

    const subscription = await prisma.subscription.create({
      data: { userId, planId, startDate: start, endDate: end, status: 'ACTIVE' },
      include: { user: { select: { id: true, name: true, email: true } }, plan: true },
    })

    return reply.status(201).send(subscription)
  })

  app.put('/:id/cancel', { preHandler: authenticate }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const subscription = await prisma.subscription.update({
      where: { id },
      data: { status: 'CANCELLED' },
    })
    return subscription
  })

  app.put('/:id/freeze', { preHandler: requireStaff }, async (req, reply) => {
    const { id } = req.params as { id: string }

    const current = await prisma.subscription.findUniqueOrThrow({ where: { id } })
    if (current.status !== 'ACTIVE') {
      return reply.status(400).send({ message: 'Só é possível congelar uma assinatura ativa' })
    }

    const subscription = await prisma.subscription.update({
      where: { id },
      data: { status: 'FROZEN', frozenAt: new Date() },
    })

    return subscription
  })

  app.put('/:id/unfreeze', { preHandler: requireStaff }, async (req, reply) => {
    const { id } = req.params as { id: string }

    const current = await prisma.subscription.findUniqueOrThrow({ where: { id } })
    if (current.status !== 'FROZEN' || !current.frozenAt) {
      return reply.status(400).send({ message: 'Essa assinatura não está congelada' })
    }

    const newEndDate = extendEndDateByFrozenDays({
      endDate: current.endDate,
      frozenAt: current.frozenAt,
      now: new Date(),
    })

    const subscription = await prisma.subscription.update({
      where: { id },
      data: { status: 'ACTIVE', endDate: newEndDate, frozenAt: null },
    })

    return subscription
  })

  app.put('/:id/renew', { preHandler: requireStaff }, async (req, reply) => {
    const { id } = req.params as { id: string }

    const current = await prisma.subscription.findUniqueOrThrow({
      where: { id },
      include: { plan: true },
    })

    const newEnd = addDays(current.endDate, current.plan.durationDays)

    const subscription = await prisma.subscription.update({
      where: { id },
      data: { endDate: newEnd, status: 'ACTIVE' },
    })

    return subscription
  })
}
