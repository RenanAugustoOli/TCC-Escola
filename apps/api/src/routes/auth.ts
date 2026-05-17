import { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../lib/prisma'

export async function authRoutes(app: FastifyInstance) {
  app.post('/login', async (req, reply) => {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(6),
    })

    const { email, password } = schema.parse(req.body)

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return reply.status(401).send({ message: 'Email ou senha inválidos' })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return reply.status(401).send({ message: 'Email ou senha inválidos' })
    }

    const token = app.jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      { expiresIn: '7d' }
    )

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    }
  })

  app.post('/register', async (req, reply) => {
    const schema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(6),
      phone: z.string().optional(),
      cpf: z.string().optional(),
    })

    const { name, email, password, phone, cpf } = schema.parse(req.body)

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return reply.status(409).send({ message: 'Email já cadastrado' })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: { name, email, passwordHash, phone, cpf, role: 'MEMBER' },
    })

    const token = app.jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      { expiresIn: '7d' }
    )

    return reply.status(201).send({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    })
  })

  app.get('/me', {
    preHandler: async (req, reply) => {
      try { await req.jwtVerify() } catch { reply.status(401).send({ message: 'Não autorizado' }) }
    },
  }, async (req) => {
    const { id } = req.user as { id: string }
    const user = await prisma.user.findUniqueOrThrow({
      where: { id },
      select: { id: true, name: true, email: true, phone: true, role: true, avatarUrl: true, createdAt: true },
    })
    return user
  })
}
