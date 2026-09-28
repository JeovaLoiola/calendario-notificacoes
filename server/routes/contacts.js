const express = require('express');
const router = express.Router();
const db = require('../db');
const { syncBirthdayTasks, calculateBirthdayInfo } = require('../services/birthdayService');
const { mutationLimiter } = require('../middlewares/rateLimiter');

// Listar todos os contatos com informações de aniversário calculadas
router.get('/', (req, res) => {
  try {
    const contacts = db.prepare('SELECT * FROM contacts ORDER BY name ASC').all();
    const enriched = contacts.map(c => {
      if (c.birth_date) {
        const info = calculateBirthdayInfo(c);
        return info || c;
      }
      return c;
    });
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar contato
router.post('/', mutationLimiter, (req, res) => {
  try {
    const { name, email, phone = '', role = '', birth_date = '', department = '' } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Nome e E-mail são obrigatórios.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'E-mail inválido.' });
    }

    const stmt = db.prepare(`
      INSERT INTO contacts (name, email, phone, role, birth_date, department)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      name.trim(),
      email.trim().toLowerCase(),
      phone.trim(),
      role.trim(),
      birth_date ? birth_date.trim() : '',
      department ? department.trim() : ''
    );

    const newContact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(result.lastInsertRowid);

    // Se tiver data de aniversário, sincroniza no calendário
    if (birth_date) {
      try {
        syncBirthdayTasks();
      } catch (syncErr) {
        console.warn('Aviso: erro ao sincronizar aniversário no calendário:', syncErr);
      }
    }

    const enriched = newContact.birth_date ? (calculateBirthdayInfo(newContact) || newContact) : newContact;
    res.status(201).json(enriched);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Atualizar contato
router.put('/:id', mutationLimiter, (req, res) => {
  try {
    const { name, email, phone = '', role = '', birth_date = '', department = '' } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Nome e E-mail são obrigatórios.' });
    }

    const stmt = db.prepare(`
      UPDATE contacts SET
        name = ?,
        email = ?,
        phone = ?,
        role = ?,
        birth_date = ?,
        department = ?
      WHERE id = ?
    `);

    const result = stmt.run(
      name.trim(),
      email.trim().toLowerCase(),
      phone.trim(),
      role.trim(),
      birth_date ? birth_date.trim() : '',
      department ? department.trim() : '',
      req.params.id
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Contato não encontrado.' });
    }

    // Sincronizar calendário se tiver data de aniversário
    if (birth_date) {
      try {
        syncBirthdayTasks();
      } catch (syncErr) {
        console.warn('Aviso: erro ao sincronizar aniversário no calendário:', syncErr);
      }
    }

    const updated = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
    const enriched = updated.birth_date ? (calculateBirthdayInfo(updated) || updated) : updated;
    res.json(enriched);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado para outro contato.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Deletar contato
router.delete('/:id', mutationLimiter, (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM contacts WHERE id = ?');
    const result = stmt.run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Contato não encontrado.' });
    }

    res.json({ message: 'Contato removido com sucesso.', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
