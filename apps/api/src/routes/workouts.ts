import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate, requireAdmin } from '../middleware/auth'

export async function workoutsRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: authenticate }, async (req) => {
    const { difficulty } = req.query as { difficulty?: string }
    const jwtUser = req.user as { id: string; role: string }

    if (jwtUser.role === 'ADMIN') {
      return prisma.workout.findMany({
        where: difficulty ? { difficulty: difficulty as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' } : {},
        include: { exercises: { orderBy: { order: 'asc' } }, _count: { select: { workoutLogs: true } } },
        orderBy: { createdAt: 'desc' },
      })
    }

    // Membro só vê treinos do seu plano ativo
    const activeSub = await prisma.subscription.findFirst({
      where: { userId: jwtUser.id, status: 'ACTIVE' },
      include: { plan: { include: { workouts: { include: { workout: { include: { exercises: { orderBy: { order: 'asc' } } } } } } } } },
    })

    if (!activeSub) return []
    return activeSub.plan.workouts.map((pw) => pw.workout)
  })

  app.get('/:id', { preHandler: authenticate }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const workout = await prisma.workout.findUnique({
      where: { id },
      include: { exercises: { orderBy: { order: 'asc' } } },
    })
    if (!workout) return reply.status(404).send({ message: 'Treino não encontrado' })
    return workout
  })

  app.post('/', { preHandler: requireAdmin }, async (req, reply) => {
    const exerciseSchema = z.object({
      name: z.string(),
      sets: z.number().int().positive(),
      reps: z.string(),
      restSeconds: z.number().int().nonnegative().default(60),
      notes: z.string().optional(),
      videoUrl: z.string().url().optional(),
      order: z.number().int().nonnegative().default(0),
    })

    const schema = z.object({
      name: z.string().min(2),
      description: z.string().optional(),
      difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
      durationMinutes: z.number().int().positive(),
      exercises: z.array(exerciseSchema),
    })

    const { exercises, ...data } = schema.parse(req.body)

    const workout = await prisma.workout.create({
      data: {
        ...data,
        exercises: { create: exercises },
      },
      include: { exercises: { orderBy: { order: 'asc' } } },
    })

    return reply.status(201).send(workout)
  })

  app.put('/:id', { preHandler: requireAdmin }, async (req, reply) => {
    const { id } = req.params as { id: string }

    const schema = z.object({
      name: z.string().min(2).optional(),
      description: z.string().optional(),
      difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
      durationMinutes: z.number().int().positive().optional(),
    })

    const data = schema.parse(req.body)
    const workout = await prisma.workout.update({ where: { id }, data })
    return workout
  })

  app.delete('/:id', { preHandler: requireAdmin }, async (req, reply) => {
    const { id } = req.params as { id: string }
    await prisma.workout.delete({ where: { id } })
    return reply.status(204).send()
  })

  // Registrar conclusão de treino
  app.post('/:id/complete', { preHandler: authenticate }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const jwtUser = req.user as { id: string }
    const { notes } = req.body as { notes?: string }

    const log = await prisma.workoutLog.create({
      data: { userId: jwtUser.id, workoutId: id, notes },
    })

    return reply.status(201).send(log)
  })

  app.get('/my/history', { preHandler: authenticate }, async (req) => {
    const jwtUser = req.user as { id: string }

    return prisma.workoutLog.findMany({
      where: { userId: jwtUser.id },
      include: { workout: { select: { id: true, name: true, durationMinutes: true } } },
      orderBy: { completedAt: 'desc' },
      take: 30,
    })
  })
}
