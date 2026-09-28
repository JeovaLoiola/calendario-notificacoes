const express = require('express');
const router = express.Router();
const db = require('../db');
const { sendTestEmail, getSmtpConfig } = require('../services/mailer');
const { emailLimiter, mutationLimiter } = require('../middlewares/rateLimiter');

// Obter configurações de SMTP
router.get('/smtp', (req, res) => {
  try {
    const config = getSmtpConfig();
    // Ocultar senha real por segurança ao enviar para o cliente
    const safeConfig = {
      ...config,
      pass: config.pass ? '••••••••' : '',
      has_password: Boolean(config.pass)
    };
    res.json(safeConfig);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Salvar configurações de SMTP
router.post('/smtp', mutationLimiter, (req, res) => {
  try {
    const {
      service = 'custom',
      host = '',
      port = 587,
      secure = false,
      user = '',
      pass = '',
      from_name = 'CALENDÁRIO OLINDINA',
      from_email = '',
      enable_simulation = true
    } = req.body;

    const currentConfig = getSmtpConfig();

    const updatedConfig = {
      service,
      host,
      port: parseInt(port, 10) || 587,
      secure: Boolean(secure),
      user,
      // Se o usuário não alterou a senha mascarada, mantém a anterior
      pass: (pass === '••••••••' || pass === '') ? currentConfig.pass : pass,
      from_name: from_name || 'CALENDÁRIO OLINDINA',
      from_email: from_email || user,
      enable_simulation: Boolean(enable_simulation)
    };

    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
      .run('smtp_config', JSON.stringify(updatedConfig));

    res.json({
      message: 'Configurações de SMTP salvas com sucesso!',
      config: {
        ...updatedConfig,
        pass: updatedConfig.pass ? '••••••••' : '',
        has_password: Boolean(updatedConfig.pass)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Testar envio de e-mail com a configuração fornecida ou salva
router.post('/smtp/test', emailLimiter, async (req, res) => {
  try {
    const { to_email, test_config } = req.body;

    if (!to_email) {
      return res.status(400).json({ error: 'Informe um e-mail de destino para o teste.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to_email.trim())) {
      return res.status(400).json({ error: 'Formato de e-mail inválido.' });
    }

    let configToUse = null;
    if (test_config) {
      const currentConfig = getSmtpConfig();
      configToUse = {
        ...test_config,
        pass: (test_config.pass === '••••••••' || !test_config.pass) ? currentConfig.pass : test_config.pass
      };
    }

    const result = await sendTestEmail(to_email, configToUse);
    res.json({
      message: 'E-mail de teste processado com sucesso!',
      result
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Falha ao testar conexão SMTP.' });
  }
});

module.exports = router;
