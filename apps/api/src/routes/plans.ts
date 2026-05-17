import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate, requireAdmin } from '../middleware/auth'

export async function plansRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: authenticate }, async () => {
    return prisma.plan.findMany({
      where: { isActive: true },
      include: { workouts: { include: { workout: true } } },
      orderBy: { price: 'asc' },
    })
  })

  app.get('/all', { preHandler: requireAdmin }, async () => {
    return prisma.plan.findMany({
      include: { _count: { select: { subscriptions: true } } },
      orderBy: { createdAt: 'desc' },
    })
  })

  app.get('/:id', { preHandler: authenticate }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const plan = await prisma.plan.findUnique({
      where: { id },
      include: { workouts: { include: { workout: { include: { exercises: { orderBy: { order: 'asc' } } } } } } },
    })
    if (!plan) return reply.status(404).send({ message: 'Plano não encontrado' })
    return plan
  })

  app.post('/', { preHandler: requireAdmin }, async (req, reply) => {
    const schema = z.object({
      name: z.string().min(2),
      description: z.string().optional(),
      price: z.number().positive(),
      durationDays: z.number().int().positive(),
      features: z.array(z.string()),
    })

    const data = schema.parse(req.body)
    const plan = await prisma.plan.create({ data })
    return reply.status(201).send(plan)
  })

  app.put('/:id', { preHandler: requireAdmin }, async (req, reply) => {
    const { id } = req.params as { id: string }

    const schema = z.object({
      name: z.string().min(2).optional(),
      description: z.string().optional(),
      price: z.number().positive().optional(),
      durationDays: z.number().int().positive().optional(),
      features: z.array(z.string()).optional(),
      isActive: z.boolean().optional(),
    })

    const data = schema.parse(req.body)
    const plan = await prisma.plan.update({ where: { id }, data })
    return plan
  })

  app.delete('/:id', { preHandler: requireAdmin }, async (req, reply) => {
    const { id } = req.params as { id: string }
    await prisma.plan.update({ where: { id }, data: { isActive: false } })
    return reply.status(204).send()
  })

  app.post('/:id/workouts', { preHandler: requireAdmin }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const { workoutId } = req.body as { workoutId: string }

    await prisma.planWorkout.create({ data: { planId: id, workoutId } })
    return reply.status(201).send({ message: 'Treino adicionado ao plano' })
  })

  app.delete('/:id/workouts/:workoutId', { preHandler: requireAdmin }, async (req, reply) => {
    const { id, workoutId } = req.params as { id: string; workoutId: string }
    await prisma.planWorkout.delete({ where: { planId_workoutId: { planId: id, workoutId } } })
    return reply.status(204).send()
  })
}
