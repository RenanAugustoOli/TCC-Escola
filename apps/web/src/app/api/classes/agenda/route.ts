import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '../../_auth'
import { brtDateString, brtDateTime, brtWeekday } from '../../_date'
import { prisma } from '../../_prisma'

const DAY_MS = 24 * 60 * 60 * 1000

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req)
    const isStaff = auth.role !== 'MEMBER'

    const dates = Array.from({ length: 7 }, (_, offset) => brtDateString(new Date(Date.now() + offset * DAY_MS)))

    const schedules = await prisma.classSchedule.findMany({
      where: { isActive: true },
      include: {
        instructor: { select: { id: true, name: true } },
        bookings: {
          where: { status: 'BOOKED', classDate: { in: dates } },
          include: { user: { select: { id: true, name: true } } },
        },
      },
      orderBy: { startTime: 'asc' },
    })

    const agenda = dates.flatMap((date) => {
      const weekday = brtWeekday(date)
      return schedules
        .filter((s) => s.weekday === weekday)
        .map((s) => {
          const bookings = s.bookings.filter((b) => b.classDate === date)
          const mine = bookings.find((b) => b.userId === auth.sub)
          return {
            scheduleId: s.id,
            name: s.name,
            description: s.description,
            instructor: s.instructor,
            date,
            startsAt: brtDateTime(date, s.startTime).toISOString(),
            durationMinutes: s.durationMinutes,
            capacity: s.capacity,
            bookedCount: bookings.length,
            spotsLeft: Math.max(0, s.capacity - bookings.length),
            bookedByMe: !!mine,
            myBookingId: mine?.id ?? null,
            // A lista de quem reservou só interessa à equipe
            ...(isStaff
              ? { bookings: bookings.map((b) => ({ id: b.id, userId: b.userId, userName: b.user.name })) }
              : {}),
          }
        })
    })

    return NextResponse.json(agenda)
  } catch {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }
}
