const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { autenticar } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// POST /auth/login
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });
  }

  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario || !usuario.ativo) {
    return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);
  if (!senhaValida) {
    return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
  }

  const token = jwt.sign(
    { id: usuario.id, perfil: usuario.perfil, nome: usuario.nome, email: usuario.email },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({
    token,
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil },
  });
});

// GET /auth/me
router.get('/me', autenticar, async (req, res) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id: req.usuario.id },
    select: { id: true, nome: true, email: true, perfil: true, ativo: true },
  });
  if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });
  res.json(usuario);
});

module.exports = router;
