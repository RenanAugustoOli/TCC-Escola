import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '../../../_auth'
import { prisma } from '../../../_prisma'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await verifyAuth(req)
    const payment = await prisma.payment.update({
      where: { id: params.id },
      data: { status: 'PAID', paidAt: new Date() },
    })
    return NextResponse.json(payment)
  } catch {
    return NextResponse.json({ message: 'Erro' }, { status: 400 })
  }
}
