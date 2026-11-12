import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '../../../_auth'
import { prisma } from '../../../_prisma'

// Histórico unificado: treinos do plano e treinos montados pelo personal.
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req)

    const [planLogs, personalLogs] = await Promise.all([
      prisma.workoutLog.findMany({
        where: { userId: auth.sub },
        include: { workout: { select: { id: true, name: true, durationMinutes: true } } },
        orderBy: { completedAt: 'desc' },
        take: 60,
      }),
      prisma.personalWorkoutLog.findMany({
        where: { studentId: auth.sub },
        include: { personalWorkout: { select: { id: true, name: true } } },
        orderBy: { completedAt: 'desc' },
        take: 60,
      }),
    ])

    const history = [
      ...planLogs.map((l) => ({
        id: l.id,
        kind: 'plan' as const,
        completedAt: l.completedAt,
        workout: { ...l.workout, durationMinutes: l.workout.durationMinutes as number | null },
      })),
      ...personalLogs.map((l) => ({
        id: l.id,
        kind: 'personal' as const,
        completedAt: l.completedAt,
        workout: { ...l.personalWorkout, durationMinutes: null as number | null },
      })),
    ].sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime())

    return NextResponse.json(history.slice(0, 60))
  } catch {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }
}
