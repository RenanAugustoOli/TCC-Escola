import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '../../_auth'
import { prisma } from '../../_prisma'

function parsePlan(p: any) {
  return { ...p, features: typeof p.features === 'string' ? JSON.parse(p.features) : p.features }
}

export async function GET(req: NextRequest) {
  try {
    await verifyAuth(req)
    const plans = await prisma.plan.findMany({ orderBy: { price: 'asc' } })
    return NextResponse.json(plans.map(parsePlan))
  } catch {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }
}
