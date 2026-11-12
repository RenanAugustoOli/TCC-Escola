import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '../_auth'
import { prisma } from '../_prisma'

export async function GET(req: NextRequest) {
  try {
    await verifyAuth(req)
    const workouts = await prisma.personalWorkout.findMany({
      include: { exercises: { orderBy: { order: 'asc' } } },
    })
    return NextResponse.json(workouts)
  } catch {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req)
    const body = await req.json()
    const w = await prisma.personalWorkout.create({
      data: { ...body, trainerId: auth.sub },
      include: { exercises: true },
    })
    return NextResponse.json(w, { status: 201 })
  } catch {
    return NextResponse.json({ message: 'Erro' }, { status: 400 })
  }
}
