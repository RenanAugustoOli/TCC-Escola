import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { prisma } from '../../_prisma'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'gymtech-super-secret-2024'
)

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization')
    if (!auth?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
    }

    const token = auth.slice(7)
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const userId = payload.sub as string

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 })
    }

    const { passwordHash: _, ...safeUser } = user
    return NextResponse.json(safeUser)
  } catch {
    return NextResponse.json({ message: 'Token inválido' }, { status: 401 })
  }
}
