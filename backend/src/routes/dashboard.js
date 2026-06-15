const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { autenticar, exigirPerfil } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /dashboard
router.get('/', autenticar, exigirPerfil('ADMINISTRADOR', 'RECEPCIONISTA'), async (req, res) => {
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);
  const inicioHoje = new Date(hoje);
  inicioHoje.setHours(0, 0, 0, 0);
  const fimHoje = new Date(hoje);
  fimHoje.setHours(23, 59, 59, 999);
  const em7Dias = new Date(hoje);
  em7Dias.setDate(em7Dias.getDate() + 7);

  const [
    totalAtivos,
    totalInadimplentes,
    checkinsHoje,
    receitaMesResult,
    vencimentosProximos,
    frequencia30Dias,
  ] = await Promise.all([
    // Alunos com matrícula ativa sem cobranças vencidas
    prisma.matricula.count({
      where: {
        status: 'ATIVO',
        cobrancas: { none: { status: 'VENCIDO' } },
      },
    }),
    // Alunos com ao menos 1 cobrança vencida
    prisma.matricula.count({
      where: {
        status: 'ATIVO',
        cobrancas: { some: { status: 'VENCIDO' } },
      },
    }),
    prisma.checkin.count({ where: { dataHora: { gte: inicioHoje, lte: fimHoje } } }),
    prisma.cobranca.aggregate({
      where: { status: 'PAGO', dataPagamento: { gte: inicioMes, lte: fimMes } },
      _sum: { valor: true },
    }),
    prisma.cobranca.findMany({
      where: {
        status: 'PENDENTE',
        vencimento: { gte: hoje, lte: em7Dias },
        matricula: { status: 'ATIVO' },
      },
      include: {
        matricula: {
          include: { aluno: { include: { usuario: { select: { nome: true } } } } },
        },
      },
      orderBy: { vencimento: 'asc' },
    }),
    // Frequência dos últimos 30 dias
    prisma.checkin.findMany({
      where: { dataHora: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      select: { dataHora: true },
    }),
  ]);

  // Agrupar frequência por dia
  const frequenciaPorDia = {};
  frequencia30Dias.forEach((c) => {
    const dia = c.dataHora.toISOString().split('T')[0];
    frequenciaPorDia[dia] = (frequenciaPorDia[dia] || 0) + 1;
  });

  res.json({
    alunosAtivos: totalAtivos,
    inadimplentes: totalInadimplentes,
    checkinsHoje,
    receitaMes: Number(receitaMesResult._sum.valor || 0),
    vencimentosProximos: vencimentosProximos.map((v) => ({
      cobrancaId: v.id,
      nome: v.matricula.aluno.usuario.nome,
      vencimento: v.vencimento,
      valor: Number(v.valor),
    })),
    frequencia30Dias: frequenciaPorDia,
  });
});

module.exports = router;
