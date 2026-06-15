const express = require('express');
const { PrismaClient } = require('@prisma/client');
const PDFDocument = require('pdfkit');
const { autenticar, exigirPerfil } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /relatorios/receita?inicio=&fim=
router.get('/receita', autenticar, exigirPerfil('ADMINISTRADOR'), async (req, res) => {
  const { inicio, fim } = req.query;
  const where = { status: 'PAGO' };
  if (inicio || fim) {
    where.dataPagamento = {};
    if (inicio) where.dataPagamento.gte = new Date(inicio);
    if (fim) where.dataPagamento.lte = new Date(fim + 'T23:59:59');
  }

  const cobranças = await prisma.cobranca.findMany({
    where,
    include: { matricula: { include: { aluno: { include: { usuario: { select: { nome: true } } } } } } },
  });

  const totalGeral = cobranças.reduce((s, c) => s + Number(c.valor), 0);
  const porForma = cobranças.reduce((acc, c) => {
    acc[c.formaPagamento] = (acc[c.formaPagamento] || 0) + Number(c.valor);
    return acc;
  }, {});

  res.json({ cobranças, totalGeral, porForma });
});

// GET /relatorios/inadimplencia?inicio=&fim=
router.get('/inadimplencia', autenticar, exigirPerfil('ADMINISTRADOR'), async (req, res) => {
  const cobranças = await prisma.cobranca.findMany({
    where: { status: 'VENCIDO' },
    include: {
      matricula: { include: { aluno: { include: { usuario: { select: { nome: true } } } } } },
    },
    orderBy: { vencimento: 'asc' },
  });

  const hoje = new Date();
  const inadimplentes = cobranças.map((c) => ({
    nome: c.matricula.aluno.usuario.nome,
    valor: Number(c.valor),
    vencimento: c.vencimento,
    diasAtraso: Math.floor((hoje - c.vencimento) / (1000 * 60 * 60 * 24)),
  }));

  res.json(inadimplentes);
});

// GET /relatorios/frequencia?inicio=&fim=
router.get('/frequencia', autenticar, exigirPerfil('ADMINISTRADOR'), async (req, res) => {
  const { inicio, fim } = req.query;
  const where = {};
  if (inicio || fim) {
    where.dataHora = {};
    if (inicio) where.dataHora.gte = new Date(inicio);
    if (fim) where.dataHora.lte = new Date(fim + 'T23:59:59');
  }

  const checkins = await prisma.checkin.findMany({ where, select: { dataHora: true } });

  const porDia = {};
  const porHora = {};
  checkins.forEach((c) => {
    const dia = c.dataHora.toISOString().split('T')[0];
    const hora = c.dataHora.getHours();
    porDia[dia] = (porDia[dia] || 0) + 1;
    porHora[hora] = (porHora[hora] || 0) + 1;
  });

  const horaPico = Object.entries(porHora).sort((a, b) => b[1] - a[1])[0];

  res.json({ total: checkins.length, porDia, porHora, horaPico: horaPico ? `${horaPico[0]}h` : null });
});

// GET /relatorios/alunos?inicio=&fim=
router.get('/alunos', autenticar, exigirPerfil('ADMINISTRADOR'), async (req, res) => {
  const { inicio, fim } = req.query;
  const where = {};
  if (inicio || fim) {
    where.dataInicio = {};
    if (inicio) where.dataInicio.gte = new Date(inicio);
    if (fim) where.dataInicio.lte = new Date(fim + 'T23:59:59');
  }

  const [novasMatriculas, cancelamentos] = await Promise.all([
    prisma.matricula.count({ where }),
    prisma.matricula.count({
      where: {
        status: 'CANCELADO',
        canceladoEm: {
          gte: inicio ? new Date(inicio) : undefined,
          lte: fim ? new Date(fim + 'T23:59:59') : undefined,
        },
      },
    }),
  ]);

  res.json({ novasMatriculas, cancelamentos });
});

// GET /relatorios/:tipo/pdf — exportar PDF
router.get('/:tipo/pdf', autenticar, exigirPerfil('ADMINISTRADOR'), async (req, res) => {
  const { tipo } = req.params;
  const { inicio, fim } = req.query;

  let dados;
  if (tipo === 'receita') {
    const r = await fetch(`http://localhost:${process.env.PORT || 3001}/relatorios/receita?inicio=${inicio || ''}&fim=${fim || ''}`, {
      headers: { Authorization: req.headers.authorization },
    });
    dados = await r.json();
  }

  const doc = new PDFDocument({ margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=gymtech-${tipo}-${Date.now()}.pdf`);
  doc.pipe(res);

  // Cabeçalho
  doc.rect(0, 0, doc.page.width, 70).fill('#1565C0');
  doc.fillColor('#FFFFFF').fontSize(24).font('Helvetica-Bold').text('GymTech', 50, 20);
  doc.fontSize(12).text(`Relatório de ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`, 50, 45);

  doc.moveDown(3);
  doc.fillColor('#000000').fontSize(10);

  if (inicio || fim) {
    doc.text(`Período: ${inicio || 'início'} a ${fim || 'hoje'}`, { align: 'right' });
  }
  doc.text(`Emitido em: ${new Date().toLocaleDateString('pt-BR')}`, { align: 'right' });
  doc.moveDown();

  if (tipo === 'receita' && dados) {
    doc.fontSize(14).font('Helvetica-Bold').text(`Total recebido: R$ ${dados.totalGeral.toFixed(2)}`);
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica');
    Object.entries(dados.porForma || {}).forEach(([forma, valor]) => {
      doc.text(`  ${forma}: R$ ${Number(valor).toFixed(2)}`);
    });
    doc.moveDown();
    doc.fontSize(10);
    (dados.cobranças || []).forEach((c) => {
      doc.text(
        `${c.matricula?.aluno?.usuario?.nome || '-'}  |  ${new Date(c.dataPagamento).toLocaleDateString('pt-BR')}  |  R$ ${Number(c.valor).toFixed(2)}  |  ${c.formaPagamento}`
      );
    });
  } else {
    doc.text('Acesse a versão web para exportar este relatório com dados completos.');
  }

  doc.end();
});

module.exports = router;
