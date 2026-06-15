const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { autenticar, exigirPerfil } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /exercicios — biblioteca
router.get('/exercicios', autenticar, async (req, res) => {
  const { busca, grupo } = req.query;
  const where = {};
  if (busca) where.nome = { contains: busca, mode: 'insensitive' };
  if (grupo) where.grupoMuscular = { contains: grupo, mode: 'insensitive' };

  const exercicios = await prisma.exercicio.findMany({ where, orderBy: { nome: 'asc' } });
  res.json(exercicios);
});

// GET /fichas — lista fichas (instrutor/admin) ou ficha própria (aluno)
router.get('/', autenticar, async (req, res) => {
  const { alunoId } = req.query;

  if (req.usuario.perfil === 'ALUNO') {
    const aluno = await prisma.aluno.findFirst({ where: { usuarioId: req.usuario.id } });
    if (!aluno) return res.status(404).json({ erro: 'Aluno não encontrado.' });

    const ficha = await prisma.fichaTreino.findFirst({
      where: { alunoId: aluno.id, status: 'ATIVA' },
      include: {
        exercicios: {
          include: { exercicio: true },
          orderBy: [{ divisao: 'asc' }, { ordem: 'asc' }],
        },
        instrutor: { include: { usuario: { select: { nome: true } } } },
      },
    });
    return res.json(ficha);
  }

  const where = { status: 'ATIVA' };
  if (alunoId) where.alunoId = Number(alunoId);

  const fichas = await prisma.fichaTreino.findMany({
    where,
    include: {
      aluno: { include: { usuario: { select: { nome: true } } } },
      instrutor: { include: { usuario: { select: { nome: true } } } },
      exercicios: { include: { exercicio: true }, orderBy: [{ divisao: 'asc' }, { ordem: 'asc' }] },
    },
    orderBy: { criadoEm: 'desc' },
  });
  res.json(fichas);
});

// GET /fichas/historico/:alunoId
router.get('/historico/:alunoId', autenticar, exigirPerfil('ADMINISTRADOR', 'INSTRUTOR'), async (req, res) => {
  const fichas = await prisma.fichaTreino.findMany({
    where: { alunoId: Number(req.params.alunoId) },
    include: {
      exercicios: { include: { exercicio: true }, orderBy: [{ divisao: 'asc' }, { ordem: 'asc' }] },
      instrutor: { include: { usuario: { select: { nome: true } } } },
    },
    orderBy: { criadoEm: 'desc' },
  });
  res.json(fichas);
});

// POST /fichas
router.post('/', autenticar, exigirPerfil('ADMINISTRADOR', 'INSTRUTOR'), async (req, res) => {
  const { alunoId, validade, exercicios } = req.body;

  if (!alunoId || !validade || !exercicios || exercicios.length === 0) {
    return res.status(400).json({ erro: 'Aluno, validade e ao menos um exercício são obrigatórios.' });
  }

  // Verificar que há ao menos 1 divisão com 1 exercício
  const divisoes = [...new Set(exercicios.map((e) => e.divisao))];
  if (divisoes.length === 0) {
    return res.status(400).json({ erro: 'A ficha precisa de ao menos 1 divisão.' });
  }

  // Buscar instrutor pelo usuário logado
  let instrutorId;
  if (req.usuario.perfil === 'INSTRUTOR') {
    const instrutor = await prisma.funcionario.findFirst({ where: { usuarioId: req.usuario.id } });
    if (!instrutor) return res.status(400).json({ erro: 'Instrutor não encontrado.' });
    instrutorId = instrutor.id;
  } else {
    // Admin pode especificar um instrutor ou usar o próprio
    const instrutor = await prisma.funcionario.findFirst({ where: { usuarioId: req.usuario.id } });
    instrutorId = instrutor?.id || 1;
  }

  // Arquivar ficha anterior
  await prisma.fichaTreino.updateMany({
    where: { alunoId: Number(alunoId), status: 'ATIVA' },
    data: { status: 'ARQUIVADA' },
  });

  const ficha = await prisma.fichaTreino.create({
    data: {
      alunoId: Number(alunoId),
      instrutorId,
      validade: new Date(validade),
      status: 'ATIVA',
      exercicios: {
        create: exercicios.map((ex, idx) => ({
          divisao: ex.divisao,
          exercicioId: Number(ex.exercicioId),
          series: Number(ex.series),
          repeticoes: String(ex.repeticoes),
          carga: ex.carga || null,
          descanso: ex.descanso || null,
          observacao: ex.observacao || null,
          ordem: ex.ordem !== undefined ? Number(ex.ordem) : idx,
        })),
      },
    },
    include: {
      exercicios: { include: { exercicio: true }, orderBy: [{ divisao: 'asc' }, { ordem: 'asc' }] },
    },
  });

  res.status(201).json(ficha);
});

// PUT /fichas/:id — atualizar exercícios
router.put('/:id', autenticar, exigirPerfil('ADMINISTRADOR', 'INSTRUTOR'), async (req, res) => {
  const { validade, exercicios } = req.body;

  const ficha = await prisma.fichaTreino.findUnique({ where: { id: Number(req.params.id) } });
  if (!ficha) return res.status(404).json({ erro: 'Ficha não encontrada.' });

  // Remover exercícios antigos e recriar
  await prisma.exercicioFicha.deleteMany({ where: { fichaId: Number(req.params.id) } });

  const atualizada = await prisma.fichaTreino.update({
    where: { id: Number(req.params.id) },
    data: {
      validade: validade ? new Date(validade) : undefined,
      exercicios: {
        create: (exercicios || []).map((ex, idx) => ({
          divisao: ex.divisao,
          exercicioId: Number(ex.exercicioId),
          series: Number(ex.series),
          repeticoes: String(ex.repeticoes),
          carga: ex.carga || null,
          descanso: ex.descanso || null,
          observacao: ex.observacao || null,
          ordem: ex.ordem !== undefined ? Number(ex.ordem) : idx,
        })),
      },
    },
    include: { exercicios: { include: { exercicio: true }, orderBy: [{ divisao: 'asc' }, { ordem: 'asc' }] } },
  });

  res.json(atualizada);
});

module.exports = router;
