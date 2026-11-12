import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '../_auth'
import { prisma } from '../_prisma'

export async function GET(req: NextRequest) {
  try {
    await verifyAuth(req)
    const classes = await prisma.classSchedule.findMany({
      include: { instructor: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
    })
    return NextResponse.json(classes)
  } catch {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await verifyAuth(req)
    const body = await req.json()
    const cls = await prisma.classSchedule.create({ data: body })
    return NextResponse.json(cls, { status: 201 })
  } catch {
    return NextResponse.json({ message: 'Erro' }, { status: 400 })
  }
}
