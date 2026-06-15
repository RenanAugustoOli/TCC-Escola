const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { autenticar, exigirPerfil } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /checkins?data=YYYY-MM-DD — lista do dia
router.get('/', autenticar, exigirPerfil('ADMINISTRADOR', 'RECEPCIONISTA'), async (req, res) => {
  const { data, alunoId } = req.query;
  const where = {};

  if (data) {
    const inicio = new Date(data);
    inicio.setHours(0, 0, 0, 0);
    const fim = new Date(data);
    fim.setHours(23, 59, 59, 999);
    where.dataHora = { gte: inicio, lte: fim };
  }
  if (alunoId) where.alunoId = Number(alunoId);

  const checkins = await prisma.checkin.findMany({
    where,
    include: {
      aluno: {
        include: { usuario: { select: { nome: true } } },
      },
    },
    orderBy: { dataHora: 'desc' },
  });
  res.json(checkins);
});

// GET /checkins/minha-frequencia — aluno vê própria frequência
router.get('/minha-frequencia', autenticar, async (req, res) => {
  const aluno = await prisma.aluno.findFirst({ where: { usuarioId: req.usuario.id } });
  if (!aluno) return res.status(404).json({ erro: 'Aluno não encontrado.' });

  const inicio = new Date();
  inicio.setDate(1);
  inicio.setHours(0, 0, 0, 0);

  const checkins = await prisma.checkin.findMany({
    where: { alunoId: aluno.id, dataHora: { gte: inicio } },
    orderBy: { dataHora: 'desc' },
  });
  res.json(checkins);
});

// POST /checkins/buscar — busca aluno para check-in
router.post('/buscar', autenticar, exigirPerfil('ADMINISTRADOR', 'RECEPCIONISTA'), async (req, res) => {
  const { termo } = req.body;
  if (!termo) return res.status(400).json({ erro: 'Termo de busca obrigatório.' });

  const alunos = await prisma.aluno.findMany({
    where: {
      OR: [
        { usuario: { nome: { contains: termo, mode: 'insensitive' } } },
        { cpf: { contains: termo.replace(/\D/g, '') } },
      ],
      usuario: { ativo: true },
    },
    include: {
      usuario: { select: { nome: true, ativo: true } },
      matriculas: {
        where: { status: 'ATIVO' },
        include: { plano: { select: { nome: true } } },
        orderBy: { dataInicio: 'desc' },
        take: 1,
      },
    },
    take: 5,
  });

  const resultado = await Promise.all(alunos.map(async (a) => {
    const matriculaAtiva = a.matriculas[0];
    let statusCheckin = 'INATIVO';
    let mensagem = 'Aluno sem matrícula ativa.';

    if (matriculaAtiva) {
      const cobrancaVencida = await prisma.cobranca.findFirst({
        where: { matriculaId: matriculaAtiva.id, status: 'VENCIDO' },
      });
      if (cobrancaVencida) {
        statusCheckin = 'INADIMPLENTE';
        mensagem = 'Aluno inadimplente. Autorizar entrada manualmente?';
      } else {
        statusCheckin = 'ATIVO';
        mensagem = 'Liberado.';
      }
    }

    return {
      id: a.id,
      nome: a.usuario.nome,
      cpf: a.cpf,
      foto: a.foto,
      plano: matriculaAtiva?.plano?.nome || null,
      statusCheckin,
      mensagem,
    };
  }));

  res.json(resultado);
});

// POST /checkins — registrar entrada
router.post('/', autenticar, exigirPerfil('ADMINISTRADOR', 'RECEPCIONISTA'), async (req, res) => {
  const { alunoId, liberarManual } = req.body;
  if (!alunoId) return res.status(400).json({ erro: 'ID do aluno é obrigatório.' });

  const aluno = await prisma.aluno.findUnique({
    where: { id: Number(alunoId) },
    include: {
      usuario: true,
      matriculas: {
        where: { status: 'ATIVO' },
        include: { plano: true },
        take: 1,
      },
    },
  });

  if (!aluno || !aluno.usuario.ativo) {
    return res.status(400).json({ erro: 'Aluno inativo não pode registrar check-in.' });
  }

  // Verificar check-in duplicado no dia
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);

  const checkinHoje = await prisma.checkin.findFirst({
    where: { alunoId: Number(alunoId), dataHora: { gte: hoje, lt: amanha } },
  });
  if (checkinHoje) {
    return res.status(400).json({ erro: 'Entrada já registrada hoje.' });
  }

  const matriculaAtiva = aluno.matriculas[0];
  if (!matriculaAtiva) {
    return res.status(400).json({ erro: 'Aluno sem matrícula ativa.' });
  }

  const cobrancaVencida = await prisma.cobranca.findFirst({
    where: { matriculaId: matriculaAtiva.id, status: 'VENCIDO' },
  });

  if (cobrancaVencida && !liberarManual) {
    return res.status(403).json({
      erro: 'Aluno inadimplente.',
      requerAutorizacao: true,
      mensagem: 'Confirme para liberar manualmente.',
    });
  }

  const checkin = await prisma.checkin.create({
    data: {
      alunoId: Number(alunoId),
      liberadoPorId: cobrancaVencida ? req.usuario.id : null,
      liberadoManual: !!cobrancaVencida,
    },
    include: { aluno: { include: { usuario: { select: { nome: true } } } } },
  });

  res.status(201).json(checkin);
});

module.exports = router;
