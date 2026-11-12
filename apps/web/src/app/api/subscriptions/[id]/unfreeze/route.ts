import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '../../../_auth'
import { prisma } from '../../../_prisma'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await verifyAuth(req)
    const sub = await prisma.subscription.update({
      where: { id: params.id },
      data: { status: 'ACTIVE', frozenAt: null },
    })
    return NextResponse.json(sub)
  } catch {
    return NextResponse.json({ message: 'Erro' }, { status: 400 })
  }
}
