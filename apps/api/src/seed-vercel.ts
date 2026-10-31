import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Populando banco de dados (modo demo SQLite)...')

  const adminHash = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gymtech.com' },
    update: {},
    create: { name: 'Administrador', email: 'admin@gymtech.com', passwordHash: adminHash, role: 'ADMIN' },
  })

  const trainerHash = await bcrypt.hash('trainer123', 10)
  const trainer = await prisma.user.upsert({
    where: { email: 'carlos@gymtech.com' },
    update: {},
    create: { name: 'Carlos Oliveira', email: 'carlos@gymtech.com', passwordHash: trainerHash, phone: '(11) 98888-1111', role: 'PERSONAL_TRAINER' },
  })

  const receptionistHash = await bcrypt.hash('recepcao123', 10)
  await prisma.user.upsert({
    where: { email: 'ana@gymtech.com' },
    update: {},
    create: { name: 'Ana Souza', email: 'ana@gymtech.com', passwordHash: receptionistHash, phone: '(11) 97777-2222', role: 'RECEPTIONIST' },
  })

  await prisma.plan.upsert({
    where: { id: 'plan-basico' },
    update: {},
    create: {
      id: 'plan-basico', name: 'Básico', description: 'Acesso à academia nos horários padrão',
      price: 89.90, durationDays: 30,
      features: JSON.stringify(['Acesso à musculação', 'Horário comercial (6h–22h)', '1 avaliação física/mês']),
    },
  })

  await prisma.plan.upsert({
    where: { id: 'plan-premium' },
    update: {},
    create: {
      id: 'plan-premium', name: 'Premium', description: 'Acesso completo com aulas e personal',
      price: 149.90, durationDays: 30,
      features: JSON.stringify(['Acesso total 24h', 'Todas as aulas em grupo', 'Personal trainer 2x/semana', 'Avaliação física mensal']),
    },
  })

  await prisma.plan.upsert({
    where: { id: 'plan-anual' },
    update: {},
    create: {
      id: 'plan-anual', name: 'Anual', description: 'Melhor custo-benefício do ano',
      price: 999.90, durationDays: 365,
      features: JSON.stringify(['Tudo do Premium', 'Desconto de 45%', 'Kit de boas-vindas GymTech', 'App exclusivo']),
    },
  })

  await prisma.workout.upsert({
    where: { id: 'workout-peito' },
    update: {},
    create: {
      id: 'workout-peito', name: 'Treino A — Peito e Tríceps',
      description: 'Foco em peitoral e tríceps para hipertrofia', difficulty: 'INTERMEDIATE', durationMinutes: 60,
      exercises: { create: [
        { name: 'Supino Reto', sets: 4, reps: '8-12', restSeconds: 90, order: 1 },
        { name: 'Supino Inclinado', sets: 3, reps: '10-12', restSeconds: 90, order: 2 },
        { name: 'Crucifixo', sets: 3, reps: '12-15', restSeconds: 60, order: 3 },
        { name: 'Tríceps Pulley', sets: 4, reps: '12-15', restSeconds: 60, order: 4 },
        { name: 'Mergulho', sets: 3, reps: '10-15', restSeconds: 60, order: 5 },
      ]},
    },
  })

  await prisma.workout.upsert({
    where: { id: 'workout-costas' },
    update: {},
    create: {
      id: 'workout-costas', name: 'Treino B — Costas e Bíceps',
      description: 'Foco em costas e bíceps para hipertrofia', difficulty: 'INTERMEDIATE', durationMinutes: 60,
      exercises: { create: [
        { name: 'Puxada Frontal', sets: 4, reps: '8-12', restSeconds: 90, order: 1 },
        { name: 'Remada Baixa', sets: 4, reps: '10-12', restSeconds: 90, order: 2 },
        { name: 'Remada Unilateral', sets: 3, reps: '10-12', restSeconds: 60, order: 3 },
        { name: 'Rosca Direta', sets: 4, reps: '10-12', restSeconds: 60, order: 4 },
        { name: 'Rosca Martelo', sets: 3, reps: '12-15', restSeconds: 60, order: 5 },
      ]},
    },
  })

  await prisma.workout.upsert({
    where: { id: 'workout-iniciante' },
    update: {},
    create: {
      id: 'workout-iniciante', name: 'Full Body Iniciante',
      description: 'Treino completo para quem está começando', difficulty: 'BEGINNER', durationMinutes: 45,
      exercises: { create: [
        { name: 'Agachamento Livre', sets: 3, reps: '15', restSeconds: 60, order: 1 },
        { name: 'Supino', sets: 3, reps: '12', restSeconds: 60, order: 2 },
        { name: 'Remada Baixa', sets: 3, reps: '12', restSeconds: 60, order: 3 },
        { name: 'Desenvolvimento', sets: 3, reps: '12', restSeconds: 60, order: 4 },
        { name: 'Prancha', sets: 3, reps: '30s', restSeconds: 45, order: 5 },
      ]},
    },
  })

  for (const pw of [
    { planId: 'plan-basico', workoutId: 'workout-iniciante' },
    { planId: 'plan-premium', workoutId: 'workout-peito' },
    { planId: 'plan-premium', workoutId: 'workout-costas' },
    { planId: 'plan-anual', workoutId: 'workout-peito' },
    { planId: 'plan-anual', workoutId: 'workout-costas' },
    { planId: 'plan-anual', workoutId: 'workout-iniciante' },
  ]) {
    await prisma.planWorkout.upsert({ where: { planId_workoutId: pw }, update: {}, create: pw })
  }

  const memberHash = await bcrypt.hash('membro123', 10)
  const member = await prisma.user.upsert({
    where: { email: 'joao@exemplo.com' },
    update: {},
    create: { name: 'João Silva', email: 'joao@exemplo.com', passwordHash: memberHash, phone: '(11) 99999-0000', role: 'MEMBER' },
  })

  const endDate = new Date()
  endDate.setDate(endDate.getDate() + 18)

  await prisma.subscription.upsert({
    where: { id: 'sub-joao' },
    update: {},
    create: { id: 'sub-joao', userId: member.id, planId: 'plan-premium', status: 'ACTIVE', startDate: new Date(), endDate },
  })

  await prisma.personalWorkout.upsert({
    where: { id: 'pw-joao-1' },
    update: {},
    create: {
      id: 'pw-joao-1', name: 'Treino Funcional Personalizado',
      description: 'Foco em core e mobilidade, adaptado para o João',
      studentId: member.id, trainerId: trainer.id,
      exercises: { create: [
        { name: 'Burpee', sets: 3, reps: '10', restSeconds: 60, order: 1 },
        { name: 'Agachamento Búlgaro', sets: 3, reps: '12 cada', restSeconds: 75, order: 2 },
        { name: 'Prancha com rotação', sets: 3, reps: '45s', restSeconds: 45, order: 3 },
        { name: 'Kettlebell Swing', sets: 4, reps: '15', restSeconds: 60, order: 4 },
      ]},
    },
  })

  for (const schedule of [
    { id: 'class-spinning-ter', name: 'Spinning', weekday: 2, startTime: '07:00', durationMinutes: 45, capacity: 15 },
    { id: 'class-spinning-qui', name: 'Spinning', weekday: 4, startTime: '07:00', durationMinutes: 45, capacity: 15 },
    { id: 'class-funcional-seg', name: 'Funcional', weekday: 1, startTime: '18:30', durationMinutes: 50, capacity: 12 },
  ]) {
    await prisma.classSchedule.upsert({ where: { id: schedule.id }, update: {}, create: { ...schedule, instructorId: trainer.id } })
  }

  void admin
  console.log('\nBanco populado com sucesso! ✅')
  console.log('Admin:      admin@gymtech.com    / admin123')
  console.log('Trainer:    carlos@gymtech.com   / trainer123')
  console.log('Recepção:   ana@gymtech.com      / recepcao123')
  console.log('Membro:     joao@exemplo.com     / membro123')
}

main().catch(console.error).finally(() => prisma.$disconnect())
