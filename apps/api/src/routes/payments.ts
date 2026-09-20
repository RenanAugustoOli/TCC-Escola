import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate, requireStaff } from '../middleware/auth'

export async function paymentsRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: requireStaff }, async (req) => {
    const { page = '1', perPage = '20', status } = req.query as Record<string, string>

    const where = status ? { status: status as 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' } : {}

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          subscription: {
            include: { user: { select: { id: true, name: true, email: true } }, plan: true },
          },
        },
        skip: (Number(page) - 1) * Number(perPage),
        take: Number(perPage),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.count({ where }),
    ])

    return { data: payments, total, page: Number(page), perPage: Number(perPage), totalPages: Math.ceil(total / Number(perPage)) }
  })

  app.post('/generate', { preHandler: authenticate }, async (req, reply) => {
    const schema = z.object({
      subscriptionId: z.string(),
      method: z.enum(['PIX', 'CREDIT_CARD', 'BOLETO']),
    })

    const { subscriptionId, method } = schema.parse(req.body)

    const subscription = await prisma.subscription.findUniqueOrThrow({
      where: { id: subscriptionId },
      include: { plan: true, user: true },
    })

    // Cria o registro de pagamento
    const payment = await prisma.payment.create({
      data: {
        subscriptionId,
        amount: subscription.plan.price,
        method,
        status: 'PENDING',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 dias
        // Em produção: integrar com Mercado Pago para gerar QR Code PIX ou link de pagamento
        pixQrCode: method === 'PIX' ? 'QR_CODE_BASE64_PLACEHOLDER' : undefined,
        pixQrCodeText: method === 'PIX' ? 'PIX_KEY_TEXT_PLACEHOLDER' : undefined,
      },
    })

    return reply.status(201).send(payment)
  })

  // Webhook do Mercado Pago
  app.post('/webhook', async (req, reply) => {
    const body = req.body as { action?: string; data?: { id?: string } }

    if (body.action === 'payment.updated' && body.data?.id) {
      const externalId = body.data.id

      // Busca o pagamento pelo ID externo e atualiza status
      const payment = await prisma.payment.findFirst({ where: { externalId } })

      if (payment) {
        // Em produção: verificar status real na API do Mercado Pago
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'PAID', paidAt: new Date() },
        })

        await prisma.subscription.update({
          where: { id: payment.subscriptionId },
          data: { status: 'ACTIVE' },
        })
      }
    }

    return reply.status(200).send({ received: true })
  })

  app.put('/:id/confirm', { preHandler: requireStaff }, async (req, reply) => {
    const { id } = req.params as { id: string }

    const payment = await prisma.payment.update({
      where: { id },
      data: { status: 'PAID', paidAt: new Date() },
    })

    await prisma.subscription.update({
      where: { id: payment.subscriptionId },
      data: { status: 'ACTIVE' },
    })

    return payment
  })
}
