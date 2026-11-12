import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '../../_auth'
import { prisma } from '../../_prisma'

export async function GET(req: NextRequest) {
  try {
    await verifyAuth(req)
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') ?? '1')
    const perPage = parseInt(searchParams.get('perPage') ?? '20')

    const [total, data] = await Promise.all([
      prisma.notification.count(),
      prisma.notification.findMany({
        skip: (page - 1) * perPage,
        take: perPage,
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return NextResponse.json({ data, total, page, perPage })
  } catch {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }
}
