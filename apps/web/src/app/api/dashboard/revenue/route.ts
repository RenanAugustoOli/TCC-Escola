import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { prisma } from '../../_prisma'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'gymtech-super-secret-2024'
)

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization')
    if (!auth?.startsWith('Bearer ')) throw new Error('Unauthorized')
    await jwtVerify(auth.slice(7), JWT_SECRET)

    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun']
    const now = new Date()

    const plans = await prisma.plan.findMany({
      include: { subscriptions: { where: { status: 'ACTIVE' } } },
    })

    const baseMrr = plans.reduce((sum, p) => sum + p.price * p.subscriptions.length, 0)

    const data = months.map((month, i) => ({
      month,
      revenue: Math.round(baseMrr * (0.75 + i * 0.05) * (0.95 + Math.random() * 0.1)),
    }))

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }
}
