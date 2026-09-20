import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import { requireAdmin } from '../middleware/auth'
import { runBillingCycle } from '../lib/billing'

export async function billingRoutes(app: FastifyInstance) {
  app.post('/run', { preHandler: requireAdmin }, async () => {
    return runBillingCycle()
  })

  app.get('/notifications', { preHandler: requireAdmin }, async (req) => {
    const { page = '1', perPage = '20' } = req.query as Record<string, string>

    const [data, total] = await Promise.all([
      prisma.notification.findMany({
        include: { user: { select: { id: true, name: true, email: true } } },
        skip: (Number(page) - 1) * Number(perPage),
        take: Number(perPage),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count(),
    ])

    return { data, total, page: Number(page), perPage: Number(perPage), totalPages: Math.ceil(total / Number(perPage)) }
  })
}
