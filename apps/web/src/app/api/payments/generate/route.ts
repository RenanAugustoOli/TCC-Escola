import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '../../_auth'
import { prisma } from '../../_prisma'

export async function POST(req: NextRequest) {
  try {
    await verifyAuth(req)
    const { subscriptionId, method } = await req.json()
    const sub = await prisma.subscription.findUnique({ where: { id: subscriptionId }, include: { plan: true } })
    if (!sub) return NextResponse.json({ message: 'Assinatura não encontrada' }, { status: 404 })

    const payment = await prisma.payment.create({
      data: {
        subscriptionId,
        amount: sub.plan.price,
        status: 'PENDING',
        method: method ?? 'PIX',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
    })
    return NextResponse.json(payment, { status: 201 })
  } catch {
    return NextResponse.json({ message: 'Erro' }, { status: 400 })
  }
}
