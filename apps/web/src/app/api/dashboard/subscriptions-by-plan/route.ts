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

    const plans = await prisma.plan.findMany({
      include: { subscriptions: { where: { status: 'ACTIVE' } } },
    })

    const data = plans.map((p) => ({
      plan: p.name,
      count: p.subscriptions.length,
    }))

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }
}
