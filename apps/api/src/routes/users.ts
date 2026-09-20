import { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate, requireAdmin, requireStaff } from '../middleware/auth'

export async function usersRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: requireStaff }, async (req) => {
    const { page = '1', perPage = '20', search, role } = req.query as Record<string, string>

    const VALID_ROLES = ['ADMIN', 'PERSONAL_TRAINER', 'MEMBER', 'RECEPTIONIST'] as const
    const roleFilter = (VALID_ROLES as readonly string[]).includes(role)
      ? { role: role as (typeof VALID_ROLES)[number] }
      : {}

    const where = {
      ...(search
        ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { email: { contains: search, mode: 'insensitive' as const } }] }
        : {}),
      ...roleFilter,
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (Number(page) - 1) * Number(perPage),
        take: Number(perPage),
        select: { id: true, name: true, email: true, phone: true, role: true, avatarUrl: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ])

    return { data: users, total, page: Number(page), perPage: Number(perPage), totalPages: Math.ceil(total / Number(perPage)) }
  })

  app.get('/:id', { preHandler: authenticate }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const jwtUser = req.user as { id: string; role: string }

    if (jwtUser.role !== 'ADMIN' && jwtUser.role !== 'RECEPTIONIST' && jwtUser.id !== id) {
      return reply.status(403).send({ message: 'Acesso negado' })
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, phone: true, role: true, avatarUrl: true, cpf: true, birthDate: true, createdAt: true },
    })

    if (!user) return reply.status(404).send({ message: 'Usuário não encontrado' })
    return user
  })

  app.put('/:id', { preHandler: authenticate }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const jwtUser = req.user as { id: string; role: string }

    if (jwtUser.role !== 'ADMIN' && jwtUser.id !== id) {
      return reply.status(403).send({ message: 'Acesso negado' })
    }

    const schema = z.object({
      name: z.string().min(2).optional(),
      phone: z.string().optional(),
      avatarUrl: z.string().url().optional(),
      password: z.string().min(6).optional(),
    })

    const data = schema.parse(req.body)
    const updateData: Record<string, unknown> = { ...data }

    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10)
      delete updateData.password
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, phone: true, role: true, avatarUrl: true },
    })

    return user
  })

  app.delete('/:id', { preHandler: requireAdmin }, async (req, reply) => {
    const { id } = req.params as { id: string }
    await prisma.user.delete({ where: { id } })
    return reply.status(204).send()
  })

  app.get('/:id/subscriptions', { preHandler: authenticate }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const jwtUser = req.user as { id: string; role: string }

    if (jwtUser.role !== 'ADMIN' && jwtUser.role !== 'RECEPTIONIST' && jwtUser.id !== id) {
      return reply.status(403).send({ message: 'Acesso negado' })
    }

    const subscriptions = await prisma.subscription.findMany({
      where: { userId: id },
      include: { plan: true, payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
      orderBy: { createdAt: 'desc' },
    })

    return subscriptions
  })

  app.get('/:id/assessments', { preHandler: authenticate }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const jwtUser = req.user as { id: string; role: string }

    if (jwtUser.role !== 'ADMIN' && jwtUser.id !== id) {
      return reply.status(403).send({ message: 'Acesso negado' })
    }

    const assessments = await prisma.physicalAssessment.findMany({
      where: { userId: id },
      orderBy: { assessedAt: 'asc' },
    })

    return assessments
  })

  app.post('/:id/assessments', { preHandler: requireAdmin }, async (req, reply) => {
    const { id } = req.params as { id: string }

    const schema = z.object({
      weightKg: z.number().positive(),
      heightCm: z.number().positive(),
      bodyFatPercent: z.number().min(0).max(100).optional(),
      waistCm: z.number().positive().optional(),
      hipCm: z.number().positive().optional(),
      chestCm: z.number().positive().optional(),
      armCm: z.number().positive().optional(),
      thighCm: z.number().positive().optional(),
      notes: z.string().optional(),
      assessedAt: z.string().datetime().optional(),
    })

    const data = schema.parse(req.body)

    const assessment = await prisma.physicalAssessment.create({
      data: {
        userId: id,
        ...data,
        assessedAt: data.assessedAt ? new Date(data.assessedAt) : new Date(),
      },
    })

    return reply.status(201).send(assessment)
  })
}
