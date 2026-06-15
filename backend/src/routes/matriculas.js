const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { autenticar, exigirPerfil } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

function gerarDataVencimento(dataBase, diaVencimento, mesOffset) {
  const data = new Date(dataBase);
  data.setMonth(data.getMonth() + mesOffset);
  data.setDate(Math.min(diaVencimento, new Date(data.getFullYear(), data.getMonth() + 1, 0).getDate()));
  data.setHours(23, 59, 59, 0);
  return data;
}

// GET /matriculas
router.get('/', autenticar, exigirPerfil('ADMINISTRADOR', 'RECEPCIONISTA'), async (req, res) => {
  const { alunoId, status } = req.query;
  const where = {};
  if (alunoId) where.alunoId = Number(alunoId);
  if (status) where.status = status.toUpperCase();

  const matriculas = await prisma.matricula.findMany({
    where,
    include: {
      aluno: { include: { usuario: { select: { nome: true, email: true } } } },
      plano: { select: { nome: true, duracaoMeses: true } },
    },
    orderBy: { dataInicio: 'desc' },
  });
  res.json(matriculas);
});

// POST /matriculas
router.post('/', autenticar, exigirPerfil('ADMINISTRADOR', 'RECEPCIONISTA'), async (req, res) => {
  const { alunoId, planoId, dataInicio, diaVencimento } = req.body;

  if (!alunoId || !planoId || !dataInicio || !diaVencimento) {
    return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });
  }
  if (diaVencimento < 1 || diaVencimento > 28) {
    return res.status(400).json({ campo: 'diaVencimento', erro: 'Dia de vencimento deve ser entre 1 e 28.' });
  }

  const matriculaAtiva = await prisma.matricula.findFirst({
    where: { alunoId: Number(alunoId), status: 'ATIVO' },
  });
  if (matriculaAtiva) {
    return res.status(400).json({ erro: 'Aluno já possui matrícula ativa.' });
  }

  const plano = await prisma.plano.findUnique({ where: { id: Number(planoId) } });
  if (!plano || !plano.ativo) {
    return res.status(400).json({ erro: 'Plano não encontrado ou inativo.' });
  }

  const inicio = new Date(dataInicio);
  const fim = new Date(dataInicio);
  fim.setMonth(fim.getMonth() + plano.duracaoMeses);

  const matricula = await prisma.matricula.create({
    data: {
      alunoId: Number(alunoId),
      planoId: Number(planoId),
      valorContratado: plano.valorMensal,
      dataInicio: inicio,
      dataFim: fim,
      diaVencimento: Number(diaVencimento),
      status: 'ATIVO',
    },
  });

  // Gerar cobranças para cada mês
  const cobranças = [];
  for (let mes = 1; mes <= plano.duracaoMeses; mes++) {
    cobranças.push({
      matriculaId: matricula.id,
      competencia: new Date(inicio.getFullYear(), inicio.getMonth() + mes - 1, 1),
      valor: plano.valorMensal,
      vencimento: gerarDataVencimento(inicio, Number(diaVencimento), mes - 1),
      status: 'PENDENTE',
    });
  }

  await prisma.cobranca.createMany({ data: cobranças });

  res.status(201).json(matricula);
});

// PATCH /matriculas/:id/cancelar
router.patch('/:id/cancelar', autenticar, exigirPerfil('ADMINISTRADOR', 'RECEPCIONISTA'), async (req, res) => {
  const { motivo } = req.body;
  if (!motivo) return res.status(400).json({ erro: 'Motivo é obrigatório.' });

  const matricula = await prisma.matricula.findUnique({ where: { id: Number(req.params.id) } });
  if (!matricula) return res.status(404).json({ erro: 'Matrícula não encontrada.' });

  await prisma.matricula.update({
    where: { id: Number(req.params.id) },
    data: {
      status: 'CANCELADO',
      motivoCancelamento: motivo,
      canceladoPorId: req.usuario.id,
      canceladoEm: new Date(),
    },
  });

  // Cancelar cobranças futuras pendentes
  await prisma.cobranca.updateMany({
    where: { matriculaId: Number(req.params.id), status: 'PENDENTE', vencimento: { gte: new Date() } },
    data: { status: 'CANCELADO' },
  });

  res.json({ mensagem: 'Matrícula cancelada com sucesso.' });
});

// POST /matriculas/:id/renovar
router.post('/:id/renovar', autenticar, exigirPerfil('ADMINISTRADOR', 'RECEPCIONISTA'), async (req, res) => {
  const matriculaAntiga = await prisma.matricula.findUnique({
    where: { id: Number(req.params.id) },
    include: { plano: true },
  });
  if (!matriculaAntiga) return res.status(404).json({ erro: 'Matrícula não encontrada.' });

  const plano = await prisma.plano.findUnique({ where: { id: matriculaAntiga.planoId } });
  const inicio = new Date(matriculaAntiga.dataFim);
  const fim = new Date(inicio);
  fim.setMonth(fim.getMonth() + plano.duracaoMeses);

  const novaMatricula = await prisma.matricula.create({
    data: {
      alunoId: matriculaAntiga.alunoId,
      planoId: matriculaAntiga.planoId,
      valorContratado: plano.valorMensal,
      dataInicio: inicio,
      dataFim: fim,
      diaVencimento: matriculaAntiga.diaVencimento,
      status: 'ATIVO',
    },
  });

  const cobranças = [];
  for (let mes = 1; mes <= plano.duracaoMeses; mes++) {
    cobranças.push({
      matriculaId: novaMatricula.id,
      competencia: new Date(inicio.getFullYear(), inicio.getMonth() + mes - 1, 1),
      valor: plano.valorMensal,
      vencimento: gerarDataVencimento(inicio, matriculaAntiga.diaVencimento, mes - 1),
      status: 'PENDENTE',
    });
  }

  await prisma.cobranca.createMany({ data: cobranças });
  res.status(201).json(novaMatricula);
});

module.exports = router;
