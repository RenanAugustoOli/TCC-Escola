require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// Garantir pasta de uploads
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.resolve(uploadDir)));

// Rotas
app.use('/auth', require('./routes/auth'));
app.use('/alunos', require('./routes/alunos'));
app.use('/funcionarios', require('./routes/funcionarios'));
app.use('/planos', require('./routes/planos'));
app.use('/matriculas', require('./routes/matriculas'));
app.use('/cobrancas', require('./routes/cobrancas'));
app.use('/fichas', require('./routes/fichas'));
app.use('/checkins', require('./routes/checkins'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/relatorios', require('./routes/relatorios'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Erro global
app.use((err, req, res, next) => {
  if (err.message === 'Apenas JPG e PNG são permitidos.') {
    return res.status(400).json({ erro: err.message });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ erro: 'Foto maior que 2 MB não é permitida.' });
  }
  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
});

const PORT = process.env.PORT || 3001;

if (require.main === module) {
  const { iniciarCron } = require('./utils/cron');
  iniciarCron();
  app.listen(PORT, () => console.log(`GymTech API rodando na porta ${PORT}`));
}

module.exports = app;
