import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '../../../_auth'
import { prisma } from '../../../_prisma'

export async function DELETE(req: NextRequest, { params }: { params: { bookingId: string } }) {
  let auth: { sub: string; role: string }
  try {
    auth = await verifyAuth(req)
  } catch {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }

  try {
    const booking = await prisma.classBooking.findUnique({ where: { id: params.bookingId } })
    if (!booking || (auth.role === 'MEMBER' && booking.userId !== auth.sub)) {
      return NextResponse.json({ message: 'Reserva não encontrada' }, { status: 404 })
    }
    await prisma.classBooking.update({ where: { id: booking.id }, data: { status: 'CANCELLED' } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ message: 'Erro ao cancelar reserva' }, { status: 400 })
  }
}
