import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '../_auth'
import { prisma } from '../_prisma'

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req)

    if (auth.role !== 'MEMBER') {
      const workouts = await prisma.workout.findMany({
        include: { exercises: { orderBy: { order: 'asc' } } },
        orderBy: { name: 'asc' },
      })
      return NextResponse.json(workouts)
    }

    // Aluno só vê os treinos do plano ativo
    const activeSub = await prisma.subscription.findFirst({
      where: { userId: auth.sub, status: 'ACTIVE' },
      orderBy: { endDate: 'desc' },
      include: {
        plan: {
          include: {
            workouts: { include: { workout: { include: { exercises: { orderBy: { order: 'asc' } } } } } },
          },
        },
      },
    })

    const workouts = (activeSub?.plan.workouts ?? [])
      .map((pw) => pw.workout)
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    return NextResponse.json(workouts)
  } catch {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }
}
