import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '../../_auth'
import { prisma } from '../../_prisma'

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req)
    const workouts = await prisma.personalWorkout.findMany({
      where: { studentId: auth.sub },
      include: { exercises: { orderBy: { order: 'asc' } }, trainer: { select: { id: true, name: true } } },
    })
    return NextResponse.json(workouts)
  } catch {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }
}
