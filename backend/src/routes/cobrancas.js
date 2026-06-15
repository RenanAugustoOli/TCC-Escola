const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { autenticar, exigirPerfil } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /cobrancas
router.get('/', autenticar, exigirPerfil('ADMINISTRADOR', 'RECEPCIONISTA'), async (req, res) => {
  const { alunoId, status, dataInicio, dataFim } = req.query;

  const where = {};
  if (status) where.status = status.toUpperCase();
  if (dataInicio || dataFim) {
    where.vencimento = {};
    if (dataInicio) where.vencimento.gte = new Date(dataInicio);
    if (dataFim) where.vencimento.lte = new Date(dataFim);
  }
  if (alunoId) {
    where.matricula = { alunoId: Number(alunoId) };
  }

  const cobranças = await prisma.cobranca.findMany({
    where,
    include: {
      matricula: {
        include: { aluno: { include: { usuario: { select: { nome: true } } } } },
      },
    },
    orderBy: [{ vencimento: 'desc' }],
  });

  const total = cobranças.reduce((sum, c) => sum + Number(c.valor), 0);
  res.json({ cobranças, total });
});

// GET /cobrancas/minhas — para o aluno ver suas cobranças
router.get('/minhas', autenticar, async (req, res) => {
  const aluno = await prisma.aluno.findFirst({ where: { usuarioId: req.usuario.id } });
  if (!aluno) return res.status(404).json({ erro: 'Aluno não encontrado.' });

  const cobranças = await prisma.cobranca.findMany({
    where: { matricula: { alunoId: aluno.id } },
    orderBy: { vencimento: 'desc' },
  });
  res.json(cobranças);
});

// POST /cobrancas/:id/pagar
router.post('/:id/pagar', autenticar, exigirPerfil('ADMINISTRADOR', 'RECEPCIONISTA'), async (req, res) => {
  const { dataPagamento, formaPagamento } = req.body;
  if (!formaPagamento) return res.status(400).json({ erro: 'Forma de pagamento é obrigatória.' });

  const formasValidas = ['DINHEIRO', 'PIX', 'CARTAO'];
  if (!formasValidas.includes(formaPagamento.toUpperCase())) {
    return res.status(400).json({ erro: 'Forma de pagamento inválida.' });
  }

  const dataPgto = dataPagamento ? new Date(dataPagamento) : new Date();
  if (dataPgto > new Date()) {
    return res.status(400).json({ erro: 'Data de pagamento não pode ser futura.' });
  }

  const cobranca = await prisma.cobranca.findUnique({ where: { id: Number(req.params.id) } });
  if (!cobranca) return res.status(404).json({ erro: 'Cobrança não encontrada.' });
  if (cobranca.status === 'PAGO') return res.status(400).json({ erro: 'Cobrança já paga.' });
  if (cobranca.status === 'CANCELADO') return res.status(400).json({ erro: 'Cobrança cancelada.' });

  const cobAtualizada = await prisma.cobranca.update({
    where: { id: Number(req.params.id) },
    data: {
      status: 'PAGO',
      dataPagamento: dataPgto,
      formaPagamento: formaPagamento.toUpperCase(),
      recebidoPorId: req.usuario.id,
    },
  });

  // Se todas as cobranças da matrícula estão pagas, o aluno não está mais inadimplente
  // (status calculado dinamicamente)
  res.json(cobAtualizada);
});

// POST /cobrancas/:id/estornar — apenas ADMINISTRADOR
router.post('/:id/estornar', autenticar, exigirPerfil('ADMINISTRADOR'), async (req, res) => {
  const { motivo } = req.body;
  if (!motivo) return res.status(400).json({ erro: 'Motivo é obrigatório para estorno.' });

  const cobranca = await prisma.cobranca.findUnique({ where: { id: Number(req.params.id) } });
  if (!cobranca) return res.status(404).json({ erro: 'Cobrança não encontrada.' });
  if (cobranca.status !== 'PAGO') return res.status(400).json({ erro: 'Apenas cobranças pagas podem ser estornadas.' });

  const cobAtualizada = await prisma.cobranca.update({
    where: { id: Number(req.params.id) },
    data: {
      status: cobranca.vencimento < new Date() ? 'VENCIDO' : 'PENDENTE',
      dataPagamento: null,
      formaPagamento: null,
      recebidoPorId: null,
      motivoEstorno: motivo,
    },
  });

  res.json(cobAtualizada);
});

// POST /cobrancas/atualizar-vencidas — cron ou chamada manual
router.post('/atualizar-vencidas', autenticar, exigirPerfil('ADMINISTRADOR'), async (req, res) => {
  const resultado = await atualizarCobrancasVencidas();
  res.json(resultado);
});

async function atualizarCobrancasVencidas() {
  const agora = new Date();
  const { count } = await prisma.cobranca.updateMany({
    where: { status: 'PENDENTE', vencimento: { lt: agora } },
    data: { status: 'VENCIDO' },
  });
  return { atualizadas: count };
}

module.exports = router;
module.exports.atualizarCobrancasVencidas = atualizarCobrancasVencidas;
