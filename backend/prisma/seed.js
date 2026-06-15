const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const exercicios = [
  { nome: 'Supino Reto', grupoMuscular: 'Peito' },
  { nome: 'Supino Inclinado', grupoMuscular: 'Peito' },
  { nome: 'Crucifixo', grupoMuscular: 'Peito' },
  { nome: 'Peck Deck', grupoMuscular: 'Peito' },
  { nome: 'Pulldown (Puxada)', grupoMuscular: 'Costas' },
  { nome: 'Remada Curvada', grupoMuscular: 'Costas' },
  { nome: 'Remada Unilateral', grupoMuscular: 'Costas' },
  { nome: 'Pull-up (Barra Fixa)', grupoMuscular: 'Costas' },
  { nome: 'Desenvolvimento com Halteres', grupoMuscular: 'Ombros' },
  { nome: 'Elevação Lateral', grupoMuscular: 'Ombros' },
  { nome: 'Elevação Frontal', grupoMuscular: 'Ombros' },
  { nome: 'Rosca Direta', grupoMuscular: 'Bíceps' },
  { nome: 'Rosca Alternada', grupoMuscular: 'Bíceps' },
  { nome: 'Rosca Martelo', grupoMuscular: 'Bíceps' },
  { nome: 'Tríceps Pulley', grupoMuscular: 'Tríceps' },
  { nome: 'Tríceps Testa', grupoMuscular: 'Tríceps' },
  { nome: 'Mergulho (Dips)', grupoMuscular: 'Tríceps' },
  { nome: 'Agachamento Livre', grupoMuscular: 'Quadríceps' },
  { nome: 'Leg Press 45°', grupoMuscular: 'Quadríceps' },
  { nome: 'Extensão de Joelho', grupoMuscular: 'Quadríceps' },
  { nome: 'Afundo', grupoMuscular: 'Quadríceps' },
  { nome: 'Flexão de Joelho (Mesa)', grupoMuscular: 'Posterior de Coxa' },
  { nome: 'Stiff', grupoMuscular: 'Posterior de Coxa' },
  { nome: 'Mesa Flexora', grupoMuscular: 'Posterior de Coxa' },
  { nome: 'Panturrilha em Pé', grupoMuscular: 'Panturrilha' },
  { nome: 'Panturrilha Sentado', grupoMuscular: 'Panturrilha' },
  { nome: 'Abdominal Crunch', grupoMuscular: 'Abdômen' },
  { nome: 'Prancha', grupoMuscular: 'Abdômen' },
  { nome: 'Abdominal Oblíquo', grupoMuscular: 'Abdômen' },
  { nome: 'Hiperextensão Lombar', grupoMuscular: 'Lombar' },
  { nome: 'Levantamento Terra', grupoMuscular: 'Lombar' },
  { nome: 'Adução de Quadril', grupoMuscular: 'Glúteos' },
  { nome: 'Cadeira Abdutora', grupoMuscular: 'Glúteos' },
  { nome: 'Hip Thrust', grupoMuscular: 'Glúteos' },
  { nome: 'Elíptico', grupoMuscular: 'Cardio' },
  { nome: 'Esteira', grupoMuscular: 'Cardio' },
  { nome: 'Bicicleta Ergométrica', grupoMuscular: 'Cardio' },
  { nome: 'Corda Naval', grupoMuscular: 'Cardio' },
  { nome: 'Burpee', grupoMuscular: 'Funcional' },
  { nome: 'Flexão de Braço', grupoMuscular: 'Funcional' },
  { nome: 'Agachamento Sumô', grupoMuscular: 'Funcional' },
  { nome: 'Kettlebell Swing', grupoMuscular: 'Funcional' },
  { nome: 'Supino com Halteres', grupoMuscular: 'Peito' },
  { nome: 'Voador (Fly)', grupoMuscular: 'Peito' },
  { nome: 'Remada Baixa', grupoMuscular: 'Costas' },
  { nome: 'Crucifixo Inverso', grupoMuscular: 'Ombros' },
  { nome: 'Rosca 21', grupoMuscular: 'Bíceps' },
  { nome: 'Rosca Concentrada', grupoMuscular: 'Bíceps' },
  { nome: 'Tríceps Francês', grupoMuscular: 'Tríceps' },
  { nome: 'Hack Squat', grupoMuscular: 'Quadríceps' },
];

async function main() {
  console.log('Iniciando seed...');

  // Admin padrão
  const senhaHash = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.usuario.upsert({
    where: { email: 'admin@gymtech.com' },
    update: {},
    create: {
      nome: 'Administrador',
      email: 'admin@gymtech.com',
      senhaHash,
      perfil: 'ADMINISTRADOR',
      ativo: true,
      funcionario: {
        create: {
          cpf: '00000000000',
          cargo: 'ADMINISTRADOR',
        },
      },
    },
  });
  console.log('Admin criado:', adminUser.email);

  // Biblioteca de exercícios
  for (const ex of exercicios) {
    await prisma.exercicio.upsert({
      where: { id: exercicios.indexOf(ex) + 1 },
      update: ex,
      create: ex,
    });
  }
  console.log(`${exercicios.length} exercícios cadastrados.`);

  // Planos de exemplo
  await prisma.plano.createMany({
    data: [
      { nome: 'Mensal', duracaoMeses: 1, valorMensal: 89.90, descricao: 'Acesso ilimitado por 1 mês', ativo: true },
      { nome: 'Trimestral', duracaoMeses: 3, valorMensal: 79.90, descricao: 'Acesso ilimitado por 3 meses', ativo: true },
      { nome: 'Semestral', duracaoMeses: 6, valorMensal: 69.90, descricao: 'Acesso ilimitado por 6 meses', ativo: true },
      { nome: 'Anual', duracaoMeses: 12, valorMensal: 59.90, descricao: 'Acesso ilimitado por 12 meses', ativo: true },
    ],
    skipDuplicates: true,
  });
  console.log('Planos criados.');

  console.log('Seed concluído!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
