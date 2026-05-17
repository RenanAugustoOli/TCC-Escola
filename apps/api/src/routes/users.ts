import { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate, requireAdmin } from '../middleware/auth'

export async function usersRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: requireAdmin }, async (req) => {
    const { page = '1', perPage = '20', search } = req.query as Record<string, string>

    const where = search
      ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { email: { contains: search, mode: 'insensitive' as const } }] }
      : {}

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

    if (jwtUser.role !== 'ADMIN' && jwtUser.id !== id) {
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

    if (jwtUser.role !== 'ADMIN' && jwtUser.id !== id) {
      return reply.status(403).send({ message: 'Acesso negado' })
    }

    const subscriptions = await prisma.subscription.findMany({
      where: { userId: id },
      include: { plan: true, payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
      orderBy: { createdAt: 'desc' },
    })

    return subscriptions
  })
}
