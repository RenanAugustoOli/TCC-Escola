import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '../../_auth'
import { prisma } from '../../_prisma'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await verifyAuth(req)
    const body = await req.json()
    const cls = await prisma.classSchedule.update({ where: { id: params.id }, data: body })
    return NextResponse.json(cls)
  } catch {
    return NextResponse.json({ message: 'Erro' }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await verifyAuth(req)
    await prisma.classSchedule.update({ where: { id: params.id }, data: { isActive: false } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ message: 'Erro' }, { status: 400 })
  }
}
