import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '../_auth'
import { prisma } from '../_prisma'

function parsePlan(p: any) {
  return { ...p, features: typeof p.features === 'string' ? JSON.parse(p.features) : p.features }
}

export async function GET(req: NextRequest) {
  try {
    await verifyAuth(req)
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    })
    return NextResponse.json(plans.map(parsePlan))
  } catch {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await verifyAuth(req)
    const body = await req.json()
    const plan = await prisma.plan.create({
      data: {
        ...body,
        features: Array.isArray(body.features) ? JSON.stringify(body.features) : body.features,
      },
    })
    return NextResponse.json(plan, { status: 201 })
  } catch {
    return NextResponse.json({ message: 'Erro ao criar plano' }, { status: 400 })
  }
}
