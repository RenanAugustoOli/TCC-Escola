import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '../../../_auth'
import { startOfBrtDay } from '../../../_date'
import { prisma } from '../../../_prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  let auth: { sub: string }
  try {
    auth = await verifyAuth(req)
  } catch {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }

  try {
    const workout = await prisma.personalWorkout.findUnique({ where: { id: params.id } })
    if (!workout || workout.studentId !== auth.sub) {
      return NextResponse.json({ message: 'Treino não encontrado' }, { status: 404 })
    }

    const alreadyToday = await prisma.personalWorkoutLog.findFirst({
      where: { studentId: auth.sub, personalWorkoutId: params.id, completedAt: { gte: startOfBrtDay() } },
    })
    if (alreadyToday) {
      return NextResponse.json({ message: 'Você já registrou esse treino hoje' }, { status: 409 })
    }

    const log = await prisma.personalWorkoutLog.create({
      data: { personalWorkoutId: params.id, studentId: auth.sub },
    })
    return NextResponse.json(log, { status: 201 })
  } catch {
    return NextResponse.json({ message: 'Não foi possível registrar o treino' }, { status: 400 })
  }
}
