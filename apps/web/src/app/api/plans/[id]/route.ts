import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '../../_auth'
import { prisma } from '../../_prisma'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await verifyAuth(req)
    await prisma.plan.update({ where: { id: params.id }, data: { isActive: false } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ message: 'Erro' }, { status: 400 })
  }
}
