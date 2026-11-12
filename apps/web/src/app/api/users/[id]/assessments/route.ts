import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '../../../_auth'
import { prisma } from '../../../_prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await verifyAuth(req)
    const items = await prisma.physicalAssessment.findMany({
      where: { userId: params.id },
      orderBy: { assessedAt: 'desc' },
    })
    return NextResponse.json(items)
  } catch {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await verifyAuth(req)
    const body = await req.json()
    const item = await prisma.physicalAssessment.create({
      data: { userId: params.id, ...body },
    })
    return NextResponse.json(item, { status: 201 })
  } catch {
    return NextResponse.json({ message: 'Erro' }, { status: 400 })
  }
}
