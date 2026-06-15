const express = require('express');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const { autenticar, exigirPerfil } = require('../middleware/auth');
const { validarCPF, limparCPF } = require('../utils/cpf');

const router = express.Router();
const prisma = new PrismaClient();

// GET /funcionarios
router.get('/', autenticar, exigirPerfil('ADMINISTRADOR'), async (req, res) => {
  const funcionarios = await prisma.funcionario.findMany({
    include: { usuario: { select: { id: true, nome: true, email: true, ativo: true, perfil: true } } },
    orderBy: { usuario: { nome: 'asc' } },
  });
  res.json(funcionarios);
});

// POST /funcionarios
router.post('/', autenticar, exigirPerfil('ADMINISTRADOR'), async (req, res) => {
  const { nome, cpf, email, telefone, cargo, cref, senha } = req.body;

  if (!nome || !cpf || !email || !cargo || !senha) {
    return res.status(400).json({ erro: 'Campos obrigatórios faltando.' });
  }

  if (cargo === 'INSTRUTOR' && !cref) {
    return res.status(400).json({ campo: 'cref', erro: 'CREF é obrigatório para instrutores.' });
  }

  const cpfLimpo = limparCPF(cpf);
  if (!validarCPF(cpfLimpo)) {
    return res.status(400).json({ campo: 'cpf', erro: 'CPF inválido.' });
  }

  const cpfExiste = await prisma.funcionario.findUnique({ where: { cpf: cpfLimpo } });
  if (cpfExiste) return res.status(400).json({ campo: 'cpf', erro: 'CPF já cadastrado.' });

  const emailExiste = await prisma.usuario.findUnique({ where: { email } });
  if (emailExiste) return res.status(400).json({ campo: 'email', erro: 'E-mail já cadastrado.' });

  const senhaHash = await bcrypt.hash(senha, 10);

  const funcionario = await prisma.funcionario.create({
    data: {
      cpf: cpfLimpo,
      cargo,
      cref: cref || null,
      usuario: {
        create: { nome, email, senhaHash, perfil: cargo, ativo: true },
      },
    },
    include: { usuario: { select: { id: true, nome: true, email: true, perfil: true } } },
  });

  res.status(201).json(funcionario);
});

// PUT /funcionarios/:id
router.put('/:id', autenticar, exigirPerfil('ADMINISTRADOR'), async (req, res) => {
  const { id } = req.params;
  const { nome, cpf, email, cargo, cref } = req.body;

  const funcionario = await prisma.funcionario.findUnique({
    where: { id: Number(id) },
    include: { usuario: true },
  });
  if (!funcionario) return res.status(404).json({ erro: 'Funcionário não encontrado.' });

  if (cargo === 'INSTRUTOR' && !cref && !funcionario.cref) {
    return res.status(400).json({ campo: 'cref', erro: 'CREF é obrigatório para instrutores.' });
  }

  if (cpf) {
    const cpfLimpo = limparCPF(cpf);
    if (!validarCPF(cpfLimpo)) return res.status(400).json({ campo: 'cpf', erro: 'CPF inválido.' });
    const cpfExiste = await prisma.funcionario.findFirst({
      where: { cpf: cpfLimpo, id: { not: Number(id) } },
    });
    if (cpfExiste) return res.status(400).json({ campo: 'cpf', erro: 'CPF já cadastrado.' });
  }

  await prisma.usuario.update({
    where: { id: funcionario.usuarioId },
    data: { nome: nome || undefined, email: email || undefined, perfil: cargo || undefined },
  });

  const atualizado = await prisma.funcionario.update({
    where: { id: Number(id) },
    data: {
      cpf: cpf ? limparCPF(cpf) : undefined,
      cargo: cargo || undefined,
      cref: cref !== undefined ? cref : undefined,
    },
    include: { usuario: { select: { id: true, nome: true, email: true, perfil: true, ativo: true } } },
  });

  res.json(atualizado);
});

// PATCH /funcionarios/:id/desativar
router.patch('/:id/desativar', autenticar, exigirPerfil('ADMINISTRADOR'), async (req, res) => {
  const funcionario = await prisma.funcionario.findUnique({
    where: { id: Number(req.params.id) },
    include: { usuario: true },
  });
  if (!funcionario) return res.status(404).json({ erro: 'Funcionário não encontrado.' });

  // Impedir desativar único admin ativo
  if (funcionario.cargo === 'ADMINISTRADOR') {
    const adminsAtivos = await prisma.funcionario.count({
      where: { cargo: 'ADMINISTRADOR', usuario: { ativo: true } },
    });
    if (adminsAtivos <= 1) {
      return res.status(400).json({ erro: 'Não é possível desativar o único administrador ativo.' });
    }
  }

  await prisma.usuario.update({ where: { id: funcionario.usuarioId }, data: { ativo: false } });
  res.json({ mensagem: 'Funcionário desativado com sucesso.' });
});

// PATCH /funcionarios/:id/ativar
router.patch('/:id/ativar', autenticar, exigirPerfil('ADMINISTRADOR'), async (req, res) => {
  const funcionario = await prisma.funcionario.findUnique({ where: { id: Number(req.params.id) } });
  if (!funcionario) return res.status(404).json({ erro: 'Funcionário não encontrado.' });

  await prisma.usuario.update({ where: { id: funcionario.usuarioId }, data: { ativo: true } });
  res.json({ mensagem: 'Funcionário ativado com sucesso.' });
});

module.exports = router;
