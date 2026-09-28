const { schedule } = require('@netlify/functions');
const { checkAndSendAutomatedNotifications } = require('../../server/services/scheduler');

// Executa verificação e envio automático 3 vezes ao dia (08:00, 12:00 e 18:00 UTC)
const handler = async (event, context) => {
  console.log('⏰ [Netlify Scheduled Function] Iniciando verificação automática de compromissos e aniversários...');
  try {
    const report = await checkAndSendAutomatedNotifications();
    console.log(`✅ [Netlify Scheduled Function] Concluído. Notificações disparadas: ${report.notificationsDispatched}`);
    return {
      statusCode: 200,
      body: JSON.stringify(report)
    };
  } catch (err) {
    console.error('❌ [Netlify Scheduled Function] Erro:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};

module.exports.handler = schedule('0 8,12,18 * * *', handler);
