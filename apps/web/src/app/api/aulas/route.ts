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

    const classes = await prisma.classSchedule.findMany({
      include: { instructor: { select: { id: true, name: true } } },
      orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
    })

    return NextResponse.json(classes)
  } catch {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }
}
