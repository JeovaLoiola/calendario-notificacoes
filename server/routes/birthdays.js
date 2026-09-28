const express = require('express');
const router = express.Router();
const db = require('../db');
const { getBirthdayList, syncBirthdayTasks, calculateBirthdayInfo } = require('../services/birthdayService');
const { generateBirthdayMessage, generateMultipleVariations } = require('../services/birthdayMessageGenerator');
const { sendBirthdayNotification } = require('../services/mailer');
const { createRateLimiter } = require('../middlewares/rateLimiter');

// Rate limiters específicos
const wishesRateLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 20, message: 'Limite de envio de felicitações atingido. Aguarde 1 minuto.' });
const generateRateLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 60, message: 'Muitas mensagens geradas em sequência. Aguarde alguns instantes.' });

// Listar todos os aniversariantes categorizados (hoje, próximos, mês, todos)
router.get('/', (req, res) => {
  try {
    const list = getBirthdayList();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Gerar ou regenerar mensagem personalizada de aniversário
router.post('/generate-message', generateRateLimiter, (req, res) => {
  try {
    const { contactId, name, role, department, seed, count = 5 } = req.body;

    let contact = { name, role, department };
    if (contactId) {
      const dbContact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(contactId);
      if (dbContact) {
        contact = { ...dbContact, ...contact };
      }
    }

    const message = generateBirthdayMessage(contact, { seed });
    const variations = generateMultipleVariations(contact, count);

    res.json({
      message,
      variations,
      contact
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Enviar felicitações / e-mail festivo de aniversário
router.post('/:id/send-wishes', wishesRateLimiter, async (req, res) => {
  try {
    const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
    if (!contact) {
      return res.status(404).json({ error: 'Funcionário/Contato não encontrado.' });
    }

    const { customMessage, customSubject, additionalRecipients = [] } = req.body;
    const message = customMessage || generateBirthdayMessage(contact);

    const result = await sendBirthdayNotification({
      contact,
      message,
      customSubject,
      additionalRecipients
    });

    // Marcar ano de envio no contato
    const currentYear = new Date().getFullYear();
    const sentYears = Array.isArray(contact.birthday_sent_years) ? [...contact.birthday_sent_years] : [];
    if (!sentYears.includes(currentYear)) {
      sentYears.push(currentYear);
      try {
        db.prepare('UPDATE contacts SET birthday_sent_years = ? WHERE id = ?')
          .run(JSON.stringify(sentYears), contact.id);
      } catch (e) {
        console.warn('Erro ao atualizar birthday_sent_years:', e);
      }
    }

    res.json({
      success: true,
      result,
      message: 'Felicitações de aniversário enviadas com sucesso!',
      sentMessage: message
    });
  } catch (err) {
    console.error('Erro ao enviar felicitações de aniversário:', err);
    res.status(500).json({ error: err.message });
  }
});

// Sincronizar todos os aniversários no calendário escolar
router.post('/sync-calendar', (req, res) => {
  try {
    const year = req.body.year || new Date().getFullYear();
    const result = syncBirthdayTasks(year);
    res.json({
      success: true,
      message: `Aniversários sincronizados no calendário com sucesso para o ano ${year}!`,
      ...result
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
