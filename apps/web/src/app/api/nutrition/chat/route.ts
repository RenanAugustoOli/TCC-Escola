import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '../../_auth'
import { prisma } from '../../_prisma'

export const maxDuration = 60

const MODEL = 'claude-opus-5-5'
const HISTORY_LIMIT = 30
const MAX_MESSAGE_LENGTH = 2000

const SYSTEM_PROMPT = `Você é a Nutri, a assistente de nutrição do aplicativo da academia GymTech. Você conversa com alunos da academia, em português do Brasil, sobre alimentação voltada para treino e saúde.

O que você faz: explica conceitos de nutrição esportiva, sugere refeições e lanches com alimentos comuns no Brasil e acessíveis, ajuda a estimar calorias e macronutrientes, monta exemplos de cardápio e adapta as sugestões ao objetivo, à rotina de treinos e às restrições que o aluno contar. Quando faltar uma informação que muda a resposta (objetivo, restrição alimentar, horário de treino), pergunte antes de montar um plano.

Limites: você oferece orientação educativa e não substitui a consulta com nutricionista ou médico. Não faça diagnósticos nem indique medicamentos, hormônios ou anabolizantes. Para quem relata doença (diabetes, problema renal, cardíaco, gastrointestinal), gestação, amamentação ou é menor de idade, dê apenas orientações gerais e recomende acompanhamento profissional. Não proponha dietas muito restritivas, jejuns prolongados nem metas de perda de peso acelerada; se a conversa indicar relação sofrida com a comida ou com o corpo, responda com acolhimento e sugira procurar um profissional de saúde. Se o assunto fugir de alimentação, hidratação, suplementação básica e hábitos ligados ao treino, diga com gentileza que esse é o seu foco.

Formato: as respostas aparecem em um chat de celular que mostra texto puro. Não use Markdown (nada de asteriscos, cerquilhas ou tabelas). Escreva de forma direta e calorosa, em parágrafos curtos; para listas, use uma linha por item começando com "•". Prefira respostas curtas, e só se alongue quando o aluno pedir um cardápio ou plano completo.`

function ageFrom(birthDate: Date | null): number | null {
  if (!birthDate) return null
  const now = new Date()
  let age = now.getFullYear() - birthDate.getFullYear()
  const beforeBirthday =
    now.getMonth() < birthDate.getMonth() ||
    (now.getMonth() === birthDate.getMonth() && now.getDate() < birthDate.getDate())
  if (beforeBirthday) age -= 1
  return age
}

async function studentContext(userId: string): Promise<string> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const [user, assessment, subscription, planLogs, personalLogs] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, birthDate: true } }),
    prisma.physicalAssessment.findFirst({ where: { userId }, orderBy: { assessedAt: 'desc' } }),
    prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { endDate: 'desc' },
      include: { plan: { select: { name: true } } },
    }),
    prisma.workoutLog.count({ where: { userId, completedAt: { gte: weekAgo } } }),
    prisma.personalWorkoutLog.count({ where: { studentId: userId, completedAt: { gte: weekAgo } } }),
  ])

  const lines = [`Nome: ${user?.name ?? 'não informado'}`]
  const age = ageFrom(user?.birthDate ?? null)
  if (age !== null) lines.push(`Idade: ${age} anos`)
  if (subscription) lines.push(`Plano na academia: ${subscription.plan.name}`)
  lines.push(`Treinos concluídos nos últimos 7 dias: ${planLogs + personalLogs}`)
  if (assessment) {
    const parts = [`peso ${assessment.weightKg} kg`, `altura ${assessment.heightCm} cm`]
    if (assessment.bodyFatPercent != null) parts.push(`gordura corporal ${assessment.bodyFatPercent}%`)
    if (assessment.waistCm != null) parts.push(`cintura ${assessment.waistCm} cm`)
    lines.push(
      `Última avaliação física (${assessment.assessedAt.toLocaleDateString('pt-BR')}): ${parts.join(', ')}`
    )
  } else {
    lines.push('Avaliação física: ainda não registrada')
  }

  return `Dados do aluno registrados na academia (use quando ajudarem; não os recite sem necessidade):\n${lines.join('\n')}`
}

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req)
    const messages = await prisma.nutritionMessage.findMany({
      where: { userId: auth.sub },
      orderBy: { createdAt: 'asc' },
      select: { id: true, role: true, content: true, createdAt: true },
    })
    return NextResponse.json(messages)
  } catch {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req)
    await prisma.nutritionMessage.deleteMany({ where: { userId: auth.sub } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  let auth: { sub: string }
  try {
    auth = await verifyAuth(req)
  } catch {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const text = typeof body?.message === 'string' ? body.message.trim() : ''
  if (!text) {
    return NextResponse.json({ message: 'Escreva uma mensagem' }, { status: 400 })
  }
  if (text.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { message: `A mensagem pode ter até ${MAX_MESSAGE_LENGTH} caracteres` },
      { status: 400 }
    )
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { message: 'A nutricionista de IA ainda não foi configurada pela academia.' },
      { status: 503 }
    )
  }

  try {
    const [recent, context] = await Promise.all([
      prisma.nutritionMessage.findMany({
        where: { userId: auth.sub },
        orderBy: { createdAt: 'desc' },
        take: HISTORY_LIMIT,
      }),
      studentContext(auth.sub),
    ])

    const messages: Anthropic.Beta.BetaMessageParam[] = [
      ...recent.reverse().map((m) => ({
        role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
        content: m.content,
      })),
      { role: 'user', content: text },
    ]

    const client = new Anthropic()
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low' },
      system: [
        { type: 'text', text: SYSTEM_PROMPT },
        { type: 'text', text: context },
      ],
      messages,
    })

    if (response.stop_reason === 'refusal') {
      return NextResponse.json(
        { message: 'Não consigo ajudar com esse pedido. Tente reformular a pergunta sobre alimentação.' },
        { status: 422 }
      )
    }

    const reply = response.content
      .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim()

    if (!reply) {
      return NextResponse.json({ message: 'A resposta veio vazia. Tente de novo.' }, { status: 502 })
    }

    const now = Date.now()
    const [, assistantMessage] = await prisma.$transaction([
      prisma.nutritionMessage.create({
        data: { userId: auth.sub, role: 'user', content: text, createdAt: new Date(now) },
      }),
      prisma.nutritionMessage.create({
        data: { userId: auth.sub, role: 'assistant', content: reply, createdAt: new Date(now + 1) },
        select: { id: true, role: true, content: true, createdAt: true },
      }),
    ])

    return NextResponse.json(assistantMessage, { status: 201 })
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
      console.error('Nutrition chat: credencial da Anthropic recusada', error.status)
      return NextResponse.json(
        { message: 'A nutricionista de IA está com a configuração incorreta. Avise a academia.' },
        { status: 503 }
      )
    }
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { message: 'Muitas perguntas ao mesmo tempo. Tente de novo em instantes.' },
        { status: 429 }
      )
    }
    if (error instanceof Anthropic.APIError) {
      console.error('Nutrition chat: erro da API', error.status, error.message)
      return NextResponse.json(
        { message: 'A nutricionista está indisponível no momento. Tente de novo em instantes.' },
        { status: 502 }
      )
    }
    console.error('Nutrition chat: erro inesperado', error)
    return NextResponse.json({ message: 'Erro ao conversar com a nutricionista.' }, { status: 500 })
  }
}
