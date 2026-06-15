const cron = require('node-cron');
const { atualizarCobrancasVencidas } = require('../routes/cobrancas');

function iniciarCron() {
  // Todo dia à meia-noite: marcar cobranças vencidas
  cron.schedule('0 0 * * *', async () => {
    console.log('[CRON] Atualizando cobranças vencidas...');
    const resultado = await atualizarCobrancasVencidas();
    console.log(`[CRON] ${resultado.atualizadas} cobranças marcadas como vencidas.`);
  });
}

module.exports = { iniciarCron };
