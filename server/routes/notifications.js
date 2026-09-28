const express = require('express');
const router = express.Router();
const db = require('../db');
const { checkAndSendAutomatedNotifications } = require('../services/scheduler');
const { emailLimiter, mutationLimiter } = require('../middlewares/rateLimiter');

// Executar verificação e disparo das notificações automáticas sob demanda ou via Cron
router.all('/run-check', emailLimiter, async (req, res) => {
  try {
    const result = await checkAndSendAutomatedNotifications();
    res.json({
      success: true,
      message: `Verificação concluída. ${result.notificationsDispatched} notificação(ões) disparada(s).`,
      report: result
    });
  } catch (err) {
    console.error('Erro ao executar verificação de notificações:', err);
    res.status(500).json({ error: err.message });
  }
});

// Listar histórico de notificações enviadas
router.get('/logs', (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const logs = db.prepare(`
      SELECT * FROM notification_logs 
      ORDER BY sent_at DESC 
      LIMIT ?
    `).all(limit);

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Limpar histórico de notificações
router.delete('/logs', mutationLimiter, (req, res) => {
  try {
    db.prepare('DELETE FROM notification_logs').run();
    res.json({ message: 'Histórico de notificações limpo com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
