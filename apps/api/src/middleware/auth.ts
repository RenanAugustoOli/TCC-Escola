import { FastifyRequest, FastifyReply } from 'fastify'

export async function authenticate(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify()
  } catch {
    reply.status(401).send({ message: 'Token inválido ou expirado' })
  }
}

export async function requireAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify()
  } catch {
    return reply.status(401).send({ message: 'Não autorizado' })
  }
  const user = req.user as { role: string }
  if (user.role !== 'ADMIN') {
    return reply.status(403).send({ message: 'Acesso negado' })
  }
}

export async function requireTrainer(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify()
  } catch {
    return reply.status(401).send({ message: 'Não autorizado' })
  }
  const user = req.user as { role: string }
  if (user.role !== 'PERSONAL_TRAINER' && user.role !== 'ADMIN') {
    return reply.status(403).send({ message: 'Acesso negado — requer personal trainer' })
  }
}

export async function requireStaff(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify()
  } catch {
    return reply.status(401).send({ message: 'Não autorizado' })
  }
  const user = req.user as { role: string }
  if (user.role !== 'ADMIN' && user.role !== 'RECEPTIONIST') {
    return reply.status(403).send({ message: 'Acesso negado — requer recepção ou admin' })
  }
}
