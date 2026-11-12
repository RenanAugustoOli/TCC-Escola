import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '../../_auth'
import { prisma } from '../../_prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await verifyAuth(req)
    const user = await prisma.user.findUnique({ where: { id: params.id } })
    if (!user) return NextResponse.json({ message: 'Não encontrado' }, { status: 404 })
    const { passwordHash: _, ...safe } = user
    return NextResponse.json(safe)
  } catch {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await verifyAuth(req)
    const body = await req.json()
    const { passwordHash: __, ...safe } = await prisma.user.update({
      where: { id: params.id },
      data: body,
    })
    return NextResponse.json(safe)
  } catch {
    return NextResponse.json({ message: 'Erro' }, { status: 400 })
  }
}
