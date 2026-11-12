import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '../_auth'
import { prisma } from '../_prisma'

export async function GET(req: NextRequest) {
  try {
    await verifyAuth(req)
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') ?? '1')
    const perPage = parseInt(searchParams.get('perPage') ?? '20')
    const search = searchParams.get('search') ?? ''
    const role = searchParams.get('role') ?? undefined

    const where = {
      ...(role ? { role } : {}),
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      } : {}),
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { name: 'asc' },
        include: {
          subscriptions: {
            include: { plan: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
    ])

    const data = users.map(({ passwordHash: _, ...u }) => u)
    return NextResponse.json({ data, total, page, perPage })
  } catch {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }
}
