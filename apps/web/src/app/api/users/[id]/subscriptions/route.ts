import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '../../../_auth'
import { prisma } from '../../../_prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await verifyAuth(req)
    const subs = await prisma.subscription.findMany({
      where: { userId: params.id },
      include: { plan: true, payments: { orderBy: { createdAt: 'desc' }, take: 5 } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(subs)
  } catch {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }
}
