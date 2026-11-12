import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '../../_auth'

export async function POST(req: NextRequest) {
  try {
    await verifyAuth(req)
    return NextResponse.json({ notified: 0, message: 'Cobrança simulada executada com sucesso' })
  } catch {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }
}
