import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import { requireAdmin } from '../middleware/auth'

export async function dashboardRoutes(app: FastifyInstance) {
  app.get('/stats', { preHandler: requireAdmin }, async () => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    const [
      totalMembers,
      activeSubscriptions,
      overdueSubscriptions,
      monthlyRevenue,
      newMembersThisMonth,
      newMembersLastMonth,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'MEMBER' } }),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.subscription.count({ where: { status: 'OVERDUE' } }),
      prisma.payment.aggregate({
        where: { status: 'PAID', paidAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.user.count({ where: { role: 'MEMBER', createdAt: { gte: startOfMonth } } }),
      prisma.user.count({ where: { role: 'MEMBER', createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
    ])

    const churnRate = newMembersLastMonth > 0
      ? ((newMembersLastMonth - newMembersThisMonth) / newMembersLastMonth) * 100
      : 0

    return {
      totalMembers,
      activeSubscriptions,
      overduePayments: overdueSubscriptions,
      monthlyRevenue: monthlyRevenue._sum.amount ?? 0,
      newMembersThisMonth,
      churnRate: Math.max(0, churnRate),
    }
  })

  app.get('/revenue', { preHandler: requireAdmin }, async () => {
    const months: { month: string; revenue: number }[] = []
    const now = new Date()

    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)

      const result = await prisma.payment.aggregate({
        where: { status: 'PAID', paidAt: { gte: start, lte: end } },
        _sum: { amount: true },
      })

      months.push({
        month: start.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        revenue: result._sum.amount ?? 0,
      })
    }

    return months
  })

  app.get('/subscriptions-by-plan', { preHandler: requireAdmin }, async () => {
    const result = await prisma.subscription.groupBy({
      by: ['planId'],
      where: { status: 'ACTIVE' },
      _count: true,
    })

    const plans = await prisma.plan.findMany({ where: { id: { in: result.map((r) => r.planId) } } })

    return result.map((r) => ({
      plan: plans.find((p) => p.id === r.planId)?.name ?? 'Desconhecido',
      count: r._count,
    }))
  })
}
