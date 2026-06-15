const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { autenticar, exigirPerfil } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /planos
router.get('/', autenticar, async (req, res) => {
  const { apenasAtivos } = req.query;
  const where = apenasAtivos === 'true' ? { ativo: true } : {};
  const planos = await prisma.plano.findMany({ where, orderBy: { duracaoMeses: 'asc' } });
  res.json(planos);
});

// POST /planos
router.post('/', autenticar, exigirPerfil('ADMINISTRADOR'), async (req, res) => {
  const { nome, duracaoMeses, valorMensal, descricao } = req.body;

  if (!nome || !duracaoMeses || !valorMensal) {
    return res.status(400).json({ erro: 'Nome, duração e valor são obrigatórios.' });
  }
  if (Number(valorMensal) <= 0) {
    return res.status(400).json({ campo: 'valorMensal', erro: 'Valor deve ser positivo.' });
  }

  const plano = await prisma.plano.create({
    data: { nome, duracaoMeses: Number(duracaoMeses), valorMensal: Number(valorMensal), descricao: descricao || null },
  });
  res.status(201).json(plano);
});

// PUT /planos/:id
router.put('/:id', autenticar, exigirPerfil('ADMINISTRADOR'), async (req, res) => {
  const { nome, duracaoMeses, valorMensal, descricao } = req.body;
  const plano = await prisma.plano.findUnique({ where: { id: Number(req.params.id) } });
  if (!plano) return res.status(404).json({ erro: 'Plano não encontrado.' });

  if (valorMensal !== undefined && Number(valorMensal) <= 0) {
    return res.status(400).json({ campo: 'valorMensal', erro: 'Valor deve ser positivo.' });
  }

  const atualizado = await prisma.plano.update({
    where: { id: Number(req.params.id) },
    data: {
      nome: nome || undefined,
      duracaoMeses: duracaoMeses ? Number(duracaoMeses) : undefined,
      valorMensal: valorMensal !== undefined ? Number(valorMensal) : undefined,
      descricao: descricao !== undefined ? descricao : undefined,
    },
  });
  res.json(atualizado);
});

// PATCH /planos/:id/inativar
router.patch('/:id/inativar', autenticar, exigirPerfil('ADMINISTRADOR'), async (req, res) => {
  const plano = await prisma.plano.findUnique({ where: { id: Number(req.params.id) } });
  if (!plano) return res.status(404).json({ erro: 'Plano não encontrado.' });
  await prisma.plano.update({ where: { id: Number(req.params.id) }, data: { ativo: false } });
  res.json({ mensagem: 'Plano inativado.' });
});

// PATCH /planos/:id/ativar
router.patch('/:id/ativar', autenticar, exigirPerfil('ADMINISTRADOR'), async (req, res) => {
  const plano = await prisma.plano.findUnique({ where: { id: Number(req.params.id) } });
  if (!plano) return res.status(404).json({ erro: 'Plano não encontrado.' });
  await prisma.plano.update({ where: { id: Number(req.params.id) }, data: { ativo: true } });
  res.json({ mensagem: 'Plano ativado.' });
});

module.exports = router;
