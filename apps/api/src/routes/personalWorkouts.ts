import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate, requireTrainer } from '../middleware/auth'

export async function personalWorkoutsRoutes(app: FastifyInstance) {
  // Listagem para o trainer ver os treinos que criou
  app.get('/trainer', { preHandler: requireTrainer }, async (req) => {
    const { id: trainerId } = req.user as { id: string }

    return prisma.personalWorkout.findMany({
      where: { trainerId },
      include: {
        student: { select: { id: true, name: true, email: true, avatarUrl: true } },
        exercises: { orderBy: { order: 'asc' } },
        _count: { select: { logs: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })
  })

  // Listagem de treinos de um aluno específico (trainer ou admin)
  app.get('/student/:studentId', { preHandler: requireTrainer }, async (req) => {
    const { studentId } = req.params as { studentId: string }

    return prisma.personalWorkout.findMany({
      where: { studentId },
      include: {
        trainer: { select: { id: true, name: true } },
        exercises: { orderBy: { order: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    })
  })

  // Aluno vê seus próprios treinos personalizados
  app.get('/my', { preHandler: authenticate }, async (req) => {
    const { id: studentId } = req.user as { id: string }

    return prisma.personalWorkout.findMany({
      where: { studentId },
      include: {
        trainer: { select: { id: true, name: true } },
        exercises: { orderBy: { order: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    })
  })

  // Criar treino personalizado para um aluno
  app.post('/', { preHandler: requireTrainer }, async (req, reply) => {
    const { id: trainerId } = req.user as { id: string }

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
      studentId: z.string(),
      exercises: z.array(exerciseSchema),
    })

    const { exercises, ...data } = schema.parse(req.body)

    const workout = await prisma.personalWorkout.create({
      data: {
        ...data,
        trainerId,
        exercises: { create: exercises },
      },
      include: {
        student: { select: { id: true, name: true, email: true } },
        exercises: { orderBy: { order: 'asc' } },
      },
    })

    return reply.status(201).send(workout)
  })

  // Atualizar treino personalizado
  app.put('/:id', { preHandler: requireTrainer }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const { id: trainerId, role } = req.user as { id: string; role: string }

    const existing = await prisma.personalWorkout.findUnique({ where: { id } })
    if (!existing) return reply.status(404).send({ message: 'Treino não encontrado' })
    if (role !== 'ADMIN' && existing.trainerId !== trainerId) {
      return reply.status(403).send({ message: 'Você não pode editar este treino' })
    }

    const schema = z.object({
      name: z.string().min(2).optional(),
      description: z.string().optional(),
      exercises: z.array(z.object({
        id: z.string().optional(),
        name: z.string(),
        sets: z.number().int().positive(),
        reps: z.string(),
        restSeconds: z.number().int().nonnegative().default(60),
        notes: z.string().optional(),
        videoUrl: z.string().url().optional(),
        order: z.number().int().nonnegative().default(0),
      })).optional(),
    })

    const { exercises, ...data } = schema.parse(req.body)

    if (exercises) {
      // Substitui todos os exercícios
      await prisma.personalExercise.deleteMany({ where: { personalWorkoutId: id } })
      await prisma.personalExercise.createMany({
        data: exercises.map((ex) => ({ ...ex, id: undefined, personalWorkoutId: id })),
      })
    }

    const workout = await prisma.personalWorkout.update({
      where: { id },
      data,
      include: {
        student: { select: { id: true, name: true, email: true } },
        exercises: { orderBy: { order: 'asc' } },
      },
    })

    return workout
  })

  // Deletar treino personalizado
  app.delete('/:id', { preHandler: requireTrainer }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const { id: trainerId, role } = req.user as { id: string; role: string }

    const existing = await prisma.personalWorkout.findUnique({ where: { id } })
    if (!existing) return reply.status(404).send({ message: 'Treino não encontrado' })
    if (role !== 'ADMIN' && existing.trainerId !== trainerId) {
      return reply.status(403).send({ message: 'Você não pode excluir este treino' })
    }

    await prisma.personalWorkout.delete({ where: { id } })
    return reply.status(204).send()
  })

  // Aluno registra conclusão de treino pessoal
  app.post('/:id/complete', { preHandler: authenticate }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const { id: studentId } = req.user as { id: string }
    const { notes } = req.body as { notes?: string }

    const log = await prisma.personalWorkoutLog.create({
      data: { personalWorkoutId: id, studentId, notes },
    })

    return reply.status(201).send(log)
  })

  // Listar alunos do trainer com seus treinos
  app.get('/my-students', { preHandler: requireTrainer }, async (req) => {
    const { id: trainerId } = req.user as { id: string }

    const workouts = await prisma.personalWorkout.findMany({
      where: { trainerId },
      select: { studentId: true },
      distinct: ['studentId'],
    })

    const studentIds = workouts.map((w) => w.studentId)

    return prisma.user.findMany({
      where: { id: { in: studentIds }, role: 'MEMBER' },
      select: {
        id: true, name: true, email: true, phone: true, avatarUrl: true,
        personalWorkoutsAsStudent: {
          where: { trainerId },
          select: { id: true, name: true, createdAt: true },
        },
      },
    })
  })
}
