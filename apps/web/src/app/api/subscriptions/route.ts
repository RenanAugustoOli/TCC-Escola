import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '../_auth'
import { prisma } from '../_prisma'

export async function GET(req: NextRequest) {
  try {
    await verifyAuth(req)
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') ?? '1')
    const perPage = parseInt(searchParams.get('perPage') ?? '20')
    const status = searchParams.get('status') ?? undefined

    const where = status ? { status } : {}

    const [total, data] = await Promise.all([
      prisma.subscription.count({ where }),
      prisma.subscription.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        include: { user: true, plan: true },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return NextResponse.json({ data, total, page, perPage })
  } catch {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }
}
