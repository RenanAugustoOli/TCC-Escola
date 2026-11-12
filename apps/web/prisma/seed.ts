import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

// Popula o banco com dados de demonstração. Pode rodar mais de uma vez: usa ids fixos e não duplica.
const prisma = new PrismaClient()

const DAY_MS = 24 * 60 * 60 * 1000
const daysAgo = (n: number) => new Date(Date.now() - n * DAY_MS)
const daysAhead = (n: number) => new Date(Date.now() + n * DAY_MS)
const brtDate = (d: Date) => new Date(d.getTime() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10)

// Gerador determinístico para o seed dar sempre o mesmo resultado
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(2026)
const pick = <T>(items: T[]): T => items[Math.floor(rand() * items.length)]
const between = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1))

const STAFF = [
  { id: 'user-admin', name: 'Administrador', email: 'admin@gymtech.com', password: 'admin123', role: 'ADMIN', phone: '(11) 3333-0000' },
  { id: 'user-carlos', name: 'Carlos Oliveira', email: 'carlos@gymtech.com', password: 'trainer123', role: 'PERSONAL_TRAINER', phone: '(11) 98888-1111' },
  { id: 'user-marina', name: 'Marina Duarte', email: 'marina@gymtech.com', password: 'trainer123', role: 'PERSONAL_TRAINER', phone: '(11) 98888-2222' },
  { id: 'user-ana', name: 'Ana Souza', email: 'ana@gymtech.com', password: 'recepcao123', role: 'RECEPTIONIST', phone: '(11) 97777-2222' },
]

const PLANS = [
  {
    id: 'plan-basico', name: 'Básico', description: 'Acesso à academia nos horários padrão', price: 89.9, durationDays: 30,
    features: ['Acesso à musculação', 'Horário comercial (6h–22h)', '1 avaliação física/mês'],
  },
  {
    id: 'plan-premium', name: 'Premium', description: 'Acesso completo com aulas e personal', price: 149.9, durationDays: 30,
    features: ['Acesso total 24h', 'Todas as aulas em grupo', 'Personal trainer 2x/semana', 'Avaliação física mensal', 'Nutricionista de IA no app'],
  },
  {
    id: 'plan-anual', name: 'Anual', description: 'Melhor custo-benefício do ano', price: 999.9, durationDays: 365,
    features: ['Tudo do Premium', 'Desconto de 45%', 'Kit de boas-vindas GymTech', 'App exclusivo'],
  },
]

type SeedExercise = { name: string; sets: number; reps: string; restSeconds: number; notes?: string }
const WORKOUTS: { id: string; name: string; description: string; difficulty: string; durationMinutes: number; exercises: SeedExercise[] }[] = [
  {
    id: 'workout-iniciante', name: 'Full Body Iniciante', description: 'Treino completo para quem está começando', difficulty: 'BEGINNER', durationMinutes: 45,
    exercises: [
      { name: 'Agachamento Livre', sets: 3, reps: '15', restSeconds: 60, notes: 'Desça até as coxas ficarem paralelas ao chão' },
      { name: 'Supino Reto', sets: 3, reps: '12', restSeconds: 60 },
      { name: 'Remada Baixa', sets: 3, reps: '12', restSeconds: 60, notes: 'Mantenha a coluna reta' },
      { name: 'Desenvolvimento com Halteres', sets: 3, reps: '12', restSeconds: 60 },
      { name: 'Prancha', sets: 3, reps: '30s', restSeconds: 45 },
    ],
  },
  {
    id: 'workout-peito', name: 'Treino A — Peito e Tríceps', description: 'Foco em peitoral e tríceps para hipertrofia', difficulty: 'INTERMEDIATE', durationMinutes: 60,
    exercises: [
      { name: 'Supino Reto', sets: 4, reps: '8-12', restSeconds: 90 },
      { name: 'Supino Inclinado com Halteres', sets: 3, reps: '10-12', restSeconds: 90 },
      { name: 'Crucifixo', sets: 3, reps: '12-15', restSeconds: 60 },
      { name: 'Tríceps Pulley', sets: 4, reps: '12-15', restSeconds: 60 },
      { name: 'Mergulho no Banco', sets: 3, reps: '10-15', restSeconds: 60 },
    ],
  },
  {
    id: 'workout-costas', name: 'Treino B — Costas e Bíceps', description: 'Foco em costas e bíceps para hipertrofia', difficulty: 'INTERMEDIATE', durationMinutes: 60,
    exercises: [
      { name: 'Puxada Frontal', sets: 4, reps: '8-12', restSeconds: 90 },
      { name: 'Remada Baixa', sets: 4, reps: '10-12', restSeconds: 90 },
      { name: 'Remada Unilateral', sets: 3, reps: '10-12', restSeconds: 60 },
      { name: 'Rosca Direta', sets: 4, reps: '10-12', restSeconds: 60 },
      { name: 'Rosca Martelo', sets: 3, reps: '12-15', restSeconds: 60 },
    ],
  },
  {
    id: 'workout-pernas', name: 'Treino C — Pernas e Glúteos', description: 'Membros inferiores completos', difficulty: 'INTERMEDIATE', durationMinutes: 65,
    exercises: [
      { name: 'Agachamento Livre', sets: 4, reps: '8-10', restSeconds: 120 },
      { name: 'Leg Press 45°', sets: 4, reps: '10-12', restSeconds: 90 },
      { name: 'Cadeira Extensora', sets: 3, reps: '12-15', restSeconds: 60 },
      { name: 'Mesa Flexora', sets: 3, reps: '12-15', restSeconds: 60 },
      { name: 'Elevação Pélvica', sets: 4, reps: '10-12', restSeconds: 90 },
      { name: 'Panturrilha em Pé', sets: 4, reps: '15-20', restSeconds: 45 },
    ],
  },
  {
    id: 'workout-ombros', name: 'Treino D — Ombros e Abdômen', description: 'Deltoides e core', difficulty: 'INTERMEDIATE', durationMinutes: 50,
    exercises: [
      { name: 'Desenvolvimento com Halteres', sets: 4, reps: '8-12', restSeconds: 90 },
      { name: 'Elevação Lateral', sets: 4, reps: '12-15', restSeconds: 60 },
      { name: 'Elevação Frontal', sets: 3, reps: '12', restSeconds: 60 },
      { name: 'Crucifixo Inverso', sets: 3, reps: '12-15', restSeconds: 60 },
      { name: 'Abdominal Supra', sets: 3, reps: '20', restSeconds: 45 },
      { name: 'Prancha', sets: 3, reps: '45s', restSeconds: 45 },
    ],
  },
  {
    id: 'workout-hiit', name: 'HIIT Queima Total', description: 'Circuito intenso para condicionamento', difficulty: 'ADVANCED', durationMinutes: 30,
    exercises: [
      { name: 'Burpee', sets: 4, reps: '12', restSeconds: 30 },
      { name: 'Kettlebell Swing', sets: 4, reps: '15', restSeconds: 30 },
      { name: 'Mountain Climber', sets: 4, reps: '40s', restSeconds: 20 },
      { name: 'Agachamento com Salto', sets: 4, reps: '15', restSeconds: 30 },
      { name: 'Corda Naval', sets: 4, reps: '30s', restSeconds: 30 },
    ],
  },
]

const PLAN_WORKOUTS: Record<string, string[]> = {
  'plan-basico': ['workout-iniciante', 'workout-pernas'],
  'plan-premium': ['workout-peito', 'workout-costas', 'workout-pernas', 'workout-ombros', 'workout-hiit'],
  'plan-anual': WORKOUTS.map((w) => w.id),
}

const STUDENT_NAMES = [
  'João Silva', 'Beatriz Almeida', 'Lucas Ferreira', 'Mariana Costa', 'Rafael Santos', 'Camila Rocha',
  'Gabriel Martins', 'Larissa Pereira', 'Thiago Carvalho', 'Juliana Ribeiro', 'Bruno Araújo', 'Fernanda Lima',
  'Diego Barbosa', 'Patrícia Gomes', 'Matheus Cardoso', 'Aline Nascimento', 'Vinícius Teixeira', 'Renata Moreira',
  'Felipe Correia', 'Isabela Mendes', 'Eduardo Pinto', 'Letícia Castro', 'Rodrigo Nunes', 'Sabrina Dias',
  'Gustavo Monteiro',
]

const slug = (name: string) =>
  name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, '.')

// Situação da assinatura de cada aluno, na ordem de STUDENT_NAMES (o primeiro é o João do login de demo)
const SITUATIONS = [
  'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE',
  'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'OVERDUE', 'OVERDUE', 'OVERDUE',
  'FROZEN', 'FROZEN', 'CANCELLED', 'CANCELLED', 'NONE',
] as const

const CLASSES = [
  { id: 'class-funcional-seg', name: 'Funcional', description: 'Circuito de força e condicionamento', weekday: 1, startTime: '18:30', durationMinutes: 50, capacity: 12, instructorId: 'user-carlos' },
  { id: 'class-spinning-ter', name: 'Spinning', description: 'Pedal indoor com música', weekday: 2, startTime: '07:00', durationMinutes: 45, capacity: 15, instructorId: 'user-marina' },
  { id: 'class-yoga-qua', name: 'Yoga', description: 'Alongamento, respiração e mobilidade', weekday: 3, startTime: '19:00', durationMinutes: 60, capacity: 14, instructorId: 'user-marina' },
  { id: 'class-spinning-qui', name: 'Spinning', description: 'Pedal indoor com música', weekday: 4, startTime: '07:00', durationMinutes: 45, capacity: 15, instructorId: 'user-marina' },
  { id: 'class-muaythai-qui', name: 'Muay Thai', description: 'Técnica e condicionamento', weekday: 4, startTime: '20:00', durationMinutes: 60, capacity: 16, instructorId: 'user-carlos' },
  { id: 'class-funcional-sex', name: 'Funcional', description: 'Circuito de força e condicionamento', weekday: 5, startTime: '18:30', durationMinutes: 50, capacity: 12, instructorId: 'user-carlos' },
  { id: 'class-pilates-sab', name: 'Pilates Solo', description: 'Fortalecimento do core', weekday: 6, startTime: '09:00', durationMinutes: 50, capacity: 10, instructorId: 'user-marina' },
  { id: 'class-zumba-sab', name: 'Zumba', description: 'Dança para suar e se divertir', weekday: 6, startTime: '10:30', durationMinutes: 50, capacity: 20, instructorId: 'user-marina' },
]

async function main() {
  console.log('Populando o banco...')

  for (const s of STAFF) {
    const passwordHash = await bcrypt.hash(s.password, 10)
    await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: { id: s.id, name: s.name, email: s.email, passwordHash, role: s.role, phone: s.phone },
    })
  }
  const staffIds = Object.fromEntries(
    (await prisma.user.findMany({ where: { email: { in: STAFF.map((s) => s.email) } } })).map((u) => [u.email, u.id])
  )
  const staffId = (seedId: string) => staffIds[STAFF.find((s) => s.id === seedId)!.email]

  for (const p of PLANS) {
    const data = { ...p, features: JSON.stringify(p.features) }
    await prisma.plan.upsert({ where: { id: p.id }, update: { features: data.features }, create: data })
  }

  for (const w of WORKOUTS) {
    const { exercises, ...data } = w
    await prisma.workout.upsert({
      where: { id: w.id },
      update: {},
      create: { ...data, exercises: { create: exercises.map((e, i) => ({ ...e, order: i + 1 })) } },
    })
  }

  await prisma.planWorkout.createMany({
    data: Object.entries(PLAN_WORKOUTS).flatMap(([planId, ids]) => ids.map((workoutId) => ({ planId, workoutId }))),
    skipDuplicates: true,
  })

  for (const c of CLASSES) {
    const { instructorId, ...data } = c
    await prisma.classSchedule.upsert({
      where: { id: c.id },
      update: {},
      create: { ...data, instructorId: staffId(instructorId) },
    })
  }

  // --- Alunos ---
  const studentHash = await bcrypt.hash('aluno123', 10)
  const joaoHash = await bcrypt.hash('membro123', 10)
  const students: { id: string; name: string; situation: (typeof SITUATIONS)[number]; planId: string | null }[] = []

  for (let i = 0; i < STUDENT_NAMES.length; i++) {
    const name = STUDENT_NAMES[i]
    const isJoao = i === 0
    const email = isJoao ? 'joao@exemplo.com' : `${slug(name)}@exemplo.com`
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        id: `aluno-${String(i + 1).padStart(2, '0')}`,
        name,
        email,
        passwordHash: isJoao ? joaoHash : studentHash,
        role: 'MEMBER',
        phone: `(11) 9${between(6000, 9999)}-${between(1000, 9999)}`,
        birthDate: new Date(Date.UTC(between(1975, 2006), between(0, 11), between(1, 28))),
        createdAt: daysAgo(between(20, 240)),
      },
    })
    const situation = SITUATIONS[i]
    const planId = situation === 'NONE' ? null : isJoao ? 'plan-premium' : pick(['plan-basico', 'plan-premium', 'plan-premium', 'plan-anual'])
    students.push({ id: user.id, name, situation, planId })
  }

  // --- Assinaturas e pagamentos ---
  const payments: { id: string; subscriptionId: string; amount: number; status: string; method: string; paidAt: Date | null; dueDate: Date; createdAt: Date }[] = []
  const notifications: { id: string; userId: string; type: string; channel: string; message: string; status: string; createdAt: Date }[] = []

  for (const [i, s] of students.entries()) {
    if (!s.planId || s.situation === 'NONE') continue
    const plan = PLANS.find((p) => p.id === s.planId)!
    const subId = `sub-${s.id}`
    const monthsPaid = plan.durationDays === 365 ? 1 : between(1, 5)
    const cycleStartOffset = s.situation === 'ACTIVE' ? between(2, plan.durationDays === 365 ? 200 : 26) : between(32, 45)
    const startDate = daysAgo(cycleStartOffset + (monthsPaid - 1) * 30)
    const endDate =
      s.situation === 'ACTIVE' || s.situation === 'FROZEN'
        ? daysAhead(plan.durationDays - cycleStartOffset > 0 ? plan.durationDays - cycleStartOffset : between(3, 20))
        : daysAgo(cycleStartOffset - 30)

    await prisma.subscription.upsert({
      where: { id: subId },
      update: {},
      create: {
        id: subId,
        userId: s.id,
        planId: plan.id,
        status: s.situation,
        startDate,
        endDate,
        frozenAt: s.situation === 'FROZEN' ? daysAgo(between(2, 10)) : null,
        createdAt: startDate,
      },
    })

    const method = pick(['PIX', 'PIX', 'CREDIT_CARD', 'BOLETO'])
    for (let m = 0; m < monthsPaid; m++) {
      const due = new Date(startDate.getTime() + m * 30 * DAY_MS)
      payments.push({
        id: `pay-${s.id}-${m}`, subscriptionId: subId, amount: plan.price, status: 'PAID', method,
        paidAt: new Date(due.getTime() + between(0, 2) * DAY_MS), dueDate: due, createdAt: due,
      })
    }
    if (s.situation === 'OVERDUE') {
      payments.push({
        id: `pay-${s.id}-pendente`, subscriptionId: subId, amount: plan.price, status: 'PENDING', method,
        paidAt: null, dueDate: endDate, createdAt: endDate,
      })
      notifications.push({
        id: `notif-${s.id}-atraso`, userId: s.id, type: 'PAYMENT_OVERDUE', channel: 'EMAIL',
        message: `Olá, ${s.name.split(' ')[0]}! Sua mensalidade do plano ${plan.name} está em atraso. Regularize para continuar treinando.`,
        status: 'SIMULATED', createdAt: daysAgo(between(0, 3)),
      })
    }
    if (s.situation === 'ACTIVE' && i % 4 === 0) {
      notifications.push({
        id: `notif-${s.id}-lembrete`, userId: s.id, type: 'PAYMENT_REMINDER', channel: 'EMAIL',
        message: `Olá, ${s.name.split(' ')[0]}! Sua assinatura do plano ${plan.name} vence em breve.`,
        status: 'SIMULATED', createdAt: daysAgo(between(1, 6)),
      })
    }
  }
  await prisma.payment.createMany({ data: payments, skipDuplicates: true })
  await prisma.notification.createMany({ data: notifications, skipDuplicates: true })

  // --- Histórico de treinos (últimos 30 dias, sem contar hoje) ---
  const workoutLogs: { id: string; userId: string; workoutId: string; completedAt: Date }[] = []
  for (const s of students) {
    if (s.situation !== 'ACTIVE' || !s.planId) continue
    const available = PLAN_WORKOUTS[s.planId]
    const frequency = 0.25 + rand() * 0.45
    for (let d = 1; d <= 30; d++) {
      if (rand() > frequency) continue
      const completedAt = new Date(daysAgo(d).setUTCHours(between(9, 23), between(0, 59), 0, 0))
      workoutLogs.push({ id: `log-${s.id}-${d}`, userId: s.id, workoutId: available[d % available.length], completedAt })
    }
  }
  await prisma.workoutLog.createMany({ data: workoutLogs, skipDuplicates: true })

  // --- Avaliações físicas ---
  const assessments: { id: string; userId: string; weightKg: number; heightCm: number; bodyFatPercent: number; waistCm: number; hipCm: number; chestCm: number; armCm: number; thighCm: number; notes: string | null; assessedAt: Date }[] = []
  for (const s of students) {
    if (s.situation === 'NONE') continue
    const heightCm = between(155, 190)
    // Peso derivado da altura para o IMC ficar plausível (20 a 29)
    const bmi = 20 + ((between(55, 98) - 55) / 43) * 9
    let weight = Math.round(bmi * (heightCm / 100) ** 2 * 10) / 10
    let fat = between(14, 32)
    const count = between(1, 3)
    for (let a = 0; a < count; a++) {
      assessments.push({
        id: `aval-${s.id}-${a}`, userId: s.id, weightKg: weight, heightCm, bodyFatPercent: fat,
        waistCm: between(68, 102), hipCm: between(88, 112), chestCm: between(84, 112), armCm: between(26, 40), thighCm: between(48, 66),
        notes: a === count - 1 ? 'Boa evolução desde a última avaliação.' : null,
        assessedAt: daysAgo((count - 1 - a) * 35 + between(3, 12)),
      })
      weight = Math.round((weight - rand() * 1.8) * 10) / 10
      fat = Math.round((fat - rand() * 1.5) * 10) / 10
    }
  }
  await prisma.physicalAssessment.createMany({ data: assessments, skipDuplicates: true })

  // --- Treinos personalizados (alunos Premium/Anual) ---
  const personal = [
    {
      id: 'pw-joao-1', studentIndex: 0, trainer: 'user-carlos', name: 'Funcional Personalizado',
      description: 'Foco em core e mobilidade, montado para você',
      exercises: [
        { name: 'Burpee', sets: 3, reps: '10', restSeconds: 60 },
        { name: 'Agachamento Búlgaro', sets: 3, reps: '12 cada perna', restSeconds: 75 },
        { name: 'Prancha com Rotação', sets: 3, reps: '45s', restSeconds: 45 },
        { name: 'Kettlebell Swing', sets: 4, reps: '15', restSeconds: 60 },
      ],
    },
    {
      id: 'pw-beatriz-1', studentIndex: 1, trainer: 'user-marina', name: 'Glúteos e Posterior',
      description: 'Ênfase em cadeia posterior',
      exercises: [
        { name: 'Elevação Pélvica', sets: 4, reps: '10-12', restSeconds: 90 },
        { name: 'Stiff', sets: 4, reps: '10', restSeconds: 90 },
        { name: 'Cadeira Abdutora', sets: 3, reps: '15', restSeconds: 60 },
        { name: 'Afundo', sets: 3, reps: '12 cada perna', restSeconds: 75 },
      ],
    },
    {
      id: 'pw-rafael-1', studentIndex: 4, trainer: 'user-carlos', name: 'Força Base',
      description: 'Progressão de carga nos básicos',
      exercises: [
        { name: 'Agachamento Livre', sets: 5, reps: '5', restSeconds: 150 },
        { name: 'Supino Reto', sets: 5, reps: '5', restSeconds: 150 },
        { name: 'Levantamento Terra', sets: 3, reps: '5', restSeconds: 180 },
      ],
    },
  ]
  for (const pw of personal) {
    const student = students[pw.studentIndex]
    await prisma.personalWorkout.upsert({
      where: { id: pw.id },
      update: {},
      create: {
        id: pw.id, name: pw.name, description: pw.description, studentId: student.id, trainerId: staffId(pw.trainer),
        exercises: { create: pw.exercises.map((e, i) => ({ ...e, order: i + 1 })) },
      },
    })
  }

  // --- Reservas de aulas nos próximos 7 dias ---
  const active = students.filter((s) => s.situation === 'ACTIVE')
  const bookings: { id: string; scheduleId: string; userId: string; bookedById: string; classDate: string; status: string }[] = []
  for (let offset = 1; offset <= 7; offset++) {
    const day = daysAhead(offset)
    const classDate = brtDate(day)
    const weekday = new Date(`${classDate}T12:00:00-03:00`).getUTCDay()
    for (const c of CLASSES.filter((k) => k.weekday === weekday)) {
      const wanted = between(3, Math.min(9, c.capacity - 2))
      const chosen = new Set<string>()
      // O João fica de fora para o aluno de demonstração reservar pelo app
      while (chosen.size < wanted) chosen.add(pick(active.slice(1)).id)
      for (const userId of chosen) {
        bookings.push({ id: `res-${c.id}-${classDate}-${userId}`, scheduleId: c.id, userId, bookedById: userId, classDate, status: 'BOOKED' })
      }
    }
  }
  await prisma.classBooking.createMany({ data: bookings, skipDuplicates: true })

  const counts = {
    usuarios: await prisma.user.count(),
    alunos: await prisma.user.count({ where: { role: 'MEMBER' } }),
    assinaturas: await prisma.subscription.count(),
    pagamentos: await prisma.payment.count(),
    treinosRegistrados: await prisma.workoutLog.count(),
    avaliacoes: await prisma.physicalAssessment.count(),
    reservas: await prisma.classBooking.count(),
  }
  console.log('Banco populado:', counts)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
