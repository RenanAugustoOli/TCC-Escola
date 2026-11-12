import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '../../_auth'
import { prisma } from '../../_prisma'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await verifyAuth(req)
    const { exercises, ...body } = await req.json()
    const w = await prisma.personalWorkout.update({
      where: { id: params.id },
      data: body,
      include: { exercises: true },
    })
    return NextResponse.json(w)
  } catch {
    return NextResponse.json({ message: 'Erro' }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await verifyAuth(req)
    await prisma.personalWorkout.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ message: 'Erro' }, { status: 400 })
  }
}
