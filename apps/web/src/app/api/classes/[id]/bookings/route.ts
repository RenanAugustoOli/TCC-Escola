import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '../../../_auth'
import { brtDateTime, brtWeekday } from '../../../_date'
import { prisma } from '../../../_prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  let auth: { sub: string; role: string }
  try {
    auth = await verifyAuth(req)
  } catch {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { date, userId } = await req.json()
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ message: 'Data inválida' }, { status: 400 })
    }

    // Aluno reserva só para si; a equipe pode reservar em nome de um aluno
    const studentId: string = auth.role === 'MEMBER' ? auth.sub : (userId ?? auth.sub)

    const schedule = await prisma.classSchedule.findUnique({ where: { id: params.id } })
    if (!schedule || !schedule.isActive) {
      return NextResponse.json({ message: 'Aula não encontrada' }, { status: 404 })
    }
    if (brtWeekday(date) !== schedule.weekday) {
      return NextResponse.json({ message: 'Essa aula não acontece nesse dia' }, { status: 400 })
    }
    if (brtDateTime(date, schedule.startTime) <= new Date()) {
      return NextResponse.json({ message: 'Essa aula já começou' }, { status: 400 })
    }

    const booked = await prisma.classBooking.findMany({
      where: { scheduleId: schedule.id, classDate: date, status: 'BOOKED' },
      select: { userId: true },
    })
    if (booked.some((b) => b.userId === studentId)) {
      return NextResponse.json({ message: 'Já existe reserva nessa aula' }, { status: 409 })
    }
    if (booked.length >= schedule.capacity) {
      return NextResponse.json({ message: 'Aula lotada' }, { status: 409 })
    }

    // Uma reserva cancelada ocupa a mesma chave única; reativa em vez de criar outra
    const booking = await prisma.classBooking.upsert({
      where: { scheduleId_userId_classDate: { scheduleId: schedule.id, userId: studentId, classDate: date } },
      update: { status: 'BOOKED', bookedById: auth.sub },
      create: { scheduleId: schedule.id, userId: studentId, bookedById: auth.sub, classDate: date, status: 'BOOKED' },
    })
    return NextResponse.json(booking, { status: 201 })
  } catch {
    return NextResponse.json({ message: 'Erro ao reservar aula' }, { status: 400 })
  }
}
