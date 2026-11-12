import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '../../../_auth'
import { startOfBrtDay } from '../../../_date'
import { prisma } from '../../../_prisma'

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req)
    const since = startOfBrtDay()

    const [planLogs, personalLogs] = await Promise.all([
      prisma.workoutLog.findMany({
        where: { userId: auth.sub, completedAt: { gte: since } },
        select: { workoutId: true },
      }),
      prisma.personalWorkoutLog.findMany({
        where: { studentId: auth.sub, completedAt: { gte: since } },
        select: { personalWorkoutId: true },
      }),
    ])

    return NextResponse.json({
      workoutIds: [...new Set(planLogs.map((l) => l.workoutId))],
      personalWorkoutIds: [...new Set(personalLogs.map((l) => l.personalWorkoutId))],
    })
  } catch {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }
}
