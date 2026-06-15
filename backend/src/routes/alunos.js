const express = require('express');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { autenticar, exigirPerfil } = require('../middleware/auth');
const { validarCPF, limparCPF } = require('../utils/cpf');

const router = express.Router();
const prisma = new PrismaClient();

const storage = multer.diskStorage({
  destination: process.env.UPLOAD_DIR || 'uploads',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `aluno-${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png'].includes(file.mimetype)) cb(null, true);
    else cb(new Error('Apenas JPG e PNG são permitidos.'));
  },
});

// GET /alunos
router.get('/', autenticar, exigirPerfil('ADMINISTRADOR', 'RECEPCIONISTA', 'INSTRUTOR'), async (req, res) => {
  const { busca, status, pagina = 1 } = req.query;
  const porPagina = 20;
  const skip = (Number(pagina) - 1) * porPagina;

  const where = {};
  if (busca) {
    where.OR = [
      { usuario: { nome: { contains: busca, mode: 'insensitive' } } },
      { cpf: { contains: busca.replace(/\D/g, '') } },
    ];
  }

  const alunos = await prisma.aluno.findMany({
    where,
    include: {
      usuario: { select: { id: true, nome: true, email: true, ativo: true } },
      matriculas: {
        where: { status: 'ATIVO' },
        include: { plano: { select: { nome: true } } },
        orderBy: { dataInicio: 'desc' },
        take: 1,
      },
    },
    skip,
    take: porPagina,
    orderBy: { usuario: { nome: 'asc' } },
  });

  const total = await prisma.aluno.count({ where });

  // Calcular status real (ativo/inadimplente/inativo)
  const hoje = new Date();
  const alunosComStatus = await Promise.all(alunos.map(async (a) => {
    const matriculaAtiva = a.matriculas[0];
    let statusAluno = 'INATIVO';

    if (matriculaAtiva) {
      const cobrancaVencida = await prisma.cobranca.findFirst({
        where: { matriculaId: matriculaAtiva.id, status: 'VENCIDO' },
      });
      statusAluno = cobrancaVencida ? 'INADIMPLENTE' : 'ATIVO';
    }

    return {
      id: a.id,
      nome: a.usuario.nome,
      email: a.usuario.email,
      cpf: a.cpf,
      telefone: a.telefone,
      foto: a.foto,
      ativo: a.usuario.ativo,
      status: statusAluno,
      plano: matriculaAtiva?.plano?.nome || null,
      vencimento: matriculaAtiva?.dataFim || null,
    };
  }));

  const filtrados = status
    ? alunosComStatus.filter((a) => a.status === status.toUpperCase() || (status === 'INATIVO' && !a.ativo))
    : alunosComStatus;

  res.json({ alunos: filtrados, total, paginas: Math.ceil(total / porPagina) });
});

// GET /alunos/:id
router.get('/:id', autenticar, async (req, res) => {
  const { id } = req.params;
  const usuarioLogado = req.usuario;

  const aluno = await prisma.aluno.findUnique({
    where: { id: Number(id) },
    include: {
      usuario: { select: { id: true, nome: true, email: true, ativo: true, perfil: true } },
    },
  });

  if (!aluno) return res.status(404).json({ erro: 'Aluno não encontrado.' });

  // Aluno só pode ver seus próprios dados
  if (usuarioLogado.perfil === 'ALUNO' && aluno.usuarioId !== usuarioLogado.id) {
    return res.status(403).json({ erro: 'Acesso não autorizado.' });
  }

  res.json(aluno);
});

// POST /alunos
router.post('/', autenticar, exigirPerfil('ADMINISTRADOR', 'RECEPCIONISTA'),
  upload.single('foto'), async (req, res) => {
    const { nome, cpf, nascimento, telefone, email, endereco, obsSaude } = req.body;

    if (!nome || !cpf || !nascimento || !telefone || !email) {
      return res.status(400).json({ erro: 'Campos obrigatórios faltando.' });
    }
    const cpfLimpo = limparCPF(cpf);
    if (!validarCPF(cpfLimpo)) {
      return res.status(400).json({ campo: 'cpf', erro: 'CPF inválido.' });
    }

    const cpfExiste = await prisma.aluno.findUnique({ where: { cpf: cpfLimpo } });
    if (cpfExiste) return res.status(400).json({ campo: 'cpf', erro: 'CPF já cadastrado.' });

    const emailExiste = await prisma.usuario.findUnique({ where: { email } });
    if (emailExiste) return res.status(400).json({ campo: 'email', erro: 'E-mail já cadastrado.' });

    const senhaProvisoria = Math.random().toString(36).slice(-8);
    const senhaHash = await bcrypt.hash(senhaProvisoria, 10);

    const aluno = await prisma.aluno.create({
      data: {
        cpf: cpfLimpo,
        nascimento: new Date(nascimento),
        telefone,
        endereco: endereco || null,
        foto: req.file ? req.file.filename : null,
        obsSaude: obsSaude || null,
        usuario: {
          create: { nome, email, senhaHash, perfil: 'ALUNO', ativo: true },
        },
      },
      include: { usuario: { select: { id: true, nome: true, email: true } } },
    });

    res.status(201).json({ aluno, senhaProvisoria });
  }
);

// PUT /alunos/:id
router.put('/:id', autenticar, exigirPerfil('ADMINISTRADOR', 'RECEPCIONISTA'),
  upload.single('foto'), async (req, res) => {
    const { id } = req.params;
    const { nome, cpf, nascimento, telefone, email, endereco, obsSaude } = req.body;

    const aluno = await prisma.aluno.findUnique({
      where: { id: Number(id) },
      include: { usuario: true },
    });
    if (!aluno) return res.status(404).json({ erro: 'Aluno não encontrado.' });

    if (cpf) {
      const cpfLimpo = limparCPF(cpf);
      if (!validarCPF(cpfLimpo)) return res.status(400).json({ campo: 'cpf', erro: 'CPF inválido.' });
      const cpfExiste = await prisma.aluno.findFirst({
        where: { cpf: cpfLimpo, id: { not: Number(id) } },
      });
      if (cpfExiste) return res.status(400).json({ campo: 'cpf', erro: 'CPF já cadastrado.' });
    }

    if (email && email !== aluno.usuario.email) {
      const emailExiste = await prisma.usuario.findFirst({
        where: { email, id: { not: aluno.usuarioId } },
      });
      if (emailExiste) return res.status(400).json({ campo: 'email', erro: 'E-mail já cadastrado.' });
    }

    await prisma.usuario.update({
      where: { id: aluno.usuarioId },
      data: { nome: nome || undefined, email: email || undefined },
    });

    const alunoAtualizado = await prisma.aluno.update({
      where: { id: Number(id) },
      data: {
        cpf: cpf ? limparCPF(cpf) : undefined,
        nascimento: nascimento ? new Date(nascimento) : undefined,
        telefone: telefone || undefined,
        endereco: endereco !== undefined ? endereco : undefined,
        foto: req.file ? req.file.filename : undefined,
        obsSaude: obsSaude !== undefined ? obsSaude : undefined,
      },
      include: { usuario: { select: { id: true, nome: true, email: true, ativo: true } } },
    });

    res.json(alunoAtualizado);
  }
);

// PATCH /alunos/:id/inativar
router.patch('/:id/inativar', autenticar, exigirPerfil('ADMINISTRADOR', 'RECEPCIONISTA'), async (req, res) => {
  const aluno = await prisma.aluno.findUnique({ where: { id: Number(req.params.id) } });
  if (!aluno) return res.status(404).json({ erro: 'Aluno não encontrado.' });

  await prisma.usuario.update({ where: { id: aluno.usuarioId }, data: { ativo: false } });
  res.json({ mensagem: 'Aluno inativado com sucesso.' });
});

// PATCH /alunos/:id/reativar
router.patch('/:id/reativar', autenticar, exigirPerfil('ADMINISTRADOR', 'RECEPCIONISTA'), async (req, res) => {
  const aluno = await prisma.aluno.findUnique({ where: { id: Number(req.params.id) } });
  if (!aluno) return res.status(404).json({ erro: 'Aluno não encontrado.' });

  await prisma.usuario.update({ where: { id: aluno.usuarioId }, data: { ativo: true } });
  res.json({ mensagem: 'Aluno reativado com sucesso.' });
});

module.exports = router;
