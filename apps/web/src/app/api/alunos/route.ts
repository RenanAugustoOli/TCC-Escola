import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { prisma } from '../_prisma'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'gymtech-super-secret-2024'
)

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization')
    if (!auth?.startsWith('Bearer ')) throw new Error('Unauthorized')
    await jwtVerify(auth.slice(7), JWT_SECRET)

    const members = await prisma.user.findMany({
      where: { role: 'MEMBER' },
      include: {
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
    })

    const data = members.map((m) => {
      const { passwordHash: _, ...safe } = m
      return safe
    })

    return NextResponse.json({ data, total: data.length, page: 1, limit: 50 })
  } catch {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }
}
