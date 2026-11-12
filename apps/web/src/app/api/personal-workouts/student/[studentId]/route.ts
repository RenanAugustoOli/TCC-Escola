import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '../../../_auth'
import { prisma } from '../../../_prisma'

export async function GET(req: NextRequest, { params }: { params: { studentId: string } }) {
  try {
    await verifyAuth(req)
    const workouts = await prisma.personalWorkout.findMany({
      where: { studentId: params.studentId },
      include: { exercises: { orderBy: { order: 'asc' } } },
    })
    return NextResponse.json(workouts)
  } catch {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }
}
