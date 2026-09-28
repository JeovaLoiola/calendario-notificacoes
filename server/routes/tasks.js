const express = require('express');
const router = express.Router();
const multer = require('multer');
const db = require('../db');
const { sendTaskNotification } = require('../services/mailer');
const { parsePdfBuffer } = require('../services/pdfParser');

const { createRateLimiter } = require('../middlewares/rateLimiter');

// Rate limiters específicos para rotas sensíveis
const notifyRateLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 20, message: 'Limite de disparos de notificação atingido. Aguarde 1 minuto.' });
const uploadRateLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 15, message: 'Muitos uploads em sequência. Aguarde 1 minuto.' });

// Configuração do Multer com validação estrita de MimeType e limite de 10MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB máximo
  fileFilter: (req, file, cb) => {
    const isPdfMime = file.mimetype === 'application/pdf' || file.mimetype === 'application/x-pdf';
    const isPdfExt = file.originalname && file.originalname.toLowerCase().endsWith('.pdf');
    if (isPdfMime || isPdfExt) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos no formato PDF são permitidos para importação.'));
    }
  }
});

function safeParseEmails(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (e) {
    if (typeof value === 'string' && value.includes('@')) {
      return value.split(',').map(e => e.trim()).filter(Boolean);
    }
    return [];
  }
}

function safeParseRemindersSent(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (e) {
    return [];
  }
}

function formatTaskResponse(task) {
  if (!task) return null;
  return {
    ...task,
    notify_emails: safeParseEmails(task.notify_emails),
    reminders_sent: safeParseRemindersSent(task.reminders_sent)
  };
}

// Listar tarefas com filtros opcionais
router.get('/', (req, res) => {
  try {
    const { month, date, status, priority, search } = req.query;
    let query = 'SELECT * FROM tasks WHERE 1=1';
    const params = [];

    if (month) {
      query += ' AND date LIKE ?';
      params.push(`${month}%`);
    }

    if (date) {
      query += ' AND date = ?';
      params.push(date);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (priority) {
      query += ' AND priority = ?';
      params.push(priority);
    }

    if (search) {
      query += ' AND (title LIKE ? OR description LIKE ? OR category LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY date ASC, start_time ASC';

    const tasks = db.prepare(query).all(...params);
    const parsedTasks = tasks.map(formatTaskResponse);

    res.json(parsedTasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Download do arquivo PDF de modelo
router.get('/template-pdf', (req, res) => {
  const path = require('path');
  const fs = require('fs');
  const templatePath = path.join(__dirname, '..', '..', 'modelo_ideal_cronograma.pdf');

  if (fs.existsSync(templatePath)) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="modelo_ideal_cronograma.pdf"');
    return res.sendFile(templatePath);
  }

  res.status(404).json({ error: 'Arquivo de modelo não encontrado.' });
});

// Limpar TODAS as tarefas
router.delete('/all', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM tasks');
    const result = stmt.run();
    res.json({ message: 'Todas as tarefas foram excluídas com sucesso.', count: result.changes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obter tarefa por ID
router.get('/:id', (req, res) => {
  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }
    res.json(formatTaskResponse(task));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar nova tarefa
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description = '',
      date,
      start_time = '',
      end_time = '',
      priority = 'media',
      status = 'pendente',
      category = 'Geral',
      color = '#3b82f6',
      notify_emails = [],
      reminder_minutes = 60,
      send_immediate_notification = false
    } = req.body;

    if (!title || !date) {
      return res.status(400).json({ error: 'Título e Data são obrigatórios.' });
    }

    const emailsJson = JSON.stringify(Array.isArray(notify_emails) ? notify_emails : safeParseEmails(notify_emails));

    const stmt = db.prepare(`
      INSERT INTO tasks (
        title, description, date, start_time, end_time, 
        priority, status, category, color, notify_emails, reminder_minutes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      title,
      description,
      date,
      start_time,
      end_time,
      priority,
      status,
      category,
      color,
      emailsJson,
      reminder_minutes
    );

    const newTask = formatTaskResponse(db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid));

    let notificationResult = null;
    if (send_immediate_notification && newTask.notify_emails.length > 0) {
      try {
        notificationResult = await sendTaskNotification({
          task: newTask,
          recipients: newTask.notify_emails,
          customNote: 'Notificação criada e enviada no momento do agendamento da tarefa.',
          stage: 'immediate'
        });
      } catch (mailErr) {
        console.error('Falha ao enviar notificação imediata:', mailErr);
      }
    }

    res.status(201).json({
      task: newTask,
      notification: notificationResult
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Importação em Lote de Tarefas (ex: vindas do PDF)
router.post('/batch', async (req, res) => {
  try {
    const { tasks: taskList, send_immediate_notification = false } = req.body;

    if (!Array.isArray(taskList) || taskList.length === 0) {
      return res.status(400).json({ error: 'Nenhuma tarefa fornecida para inserção em lote.' });
    }

    const insertStmt = db.prepare(`
      INSERT INTO tasks (
        title, description, date, start_time, end_time, 
        priority, status, category, color, notify_emails, reminder_minutes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertedTasks = [];

    const insertMany = db.transaction((items) => {
      for (const item of items) {
        if (!item.title || !item.date) continue;

        const emailsArray = Array.isArray(item.notify_emails) ? item.notify_emails : safeParseEmails(item.notify_emails);
        const emailsJson = JSON.stringify(emailsArray);

        const result = insertStmt.run(
          item.title,
          item.description || '',
          item.date,
          item.start_time || '09:00',
          item.end_time || '',
          item.priority || 'media',
          item.status || 'pendente',
          item.category || 'Geral',
          item.color || '#3b82f6',
          emailsJson,
          item.reminder_minutes !== undefined ? item.reminder_minutes : 60
        );

        const inserted = formatTaskResponse(db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid));
        insertedTasks.push(inserted);
      }
    });

    insertMany(taskList);

    let notificationsSent = 0;
    if (send_immediate_notification) {
      for (const task of insertedTasks) {
        if (task.notify_emails && task.notify_emails.length > 0) {
          try {
            await sendTaskNotification({
              task,
              recipients: task.notify_emails,
              customNote: 'Evento importado via documento PDF.',
              stage: 'immediate'
            });
            notificationsSent++;
          } catch (mailErr) {
            console.error(`Falha no envio de notificação para a tarefa ${task.id}:`, mailErr);
          }
        }
      }
    }

    res.status(201).json({
      message: `${insertedTasks.length} tarefa(s) importada(s) com sucesso!`,
      count: insertedTasks.length,
      tasks: insertedTasks,
      notificationsSent
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload e Pré-visualização de Eventos do PDF
router.post('/import-pdf-preview', uploadRateLimiter, upload.single('pdfFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo PDF foi enviado.' });
    }

    if (!req.file.mimetype.includes('pdf') && !req.file.originalname.toLowerCase().endsWith('.pdf')) {
      return res.status(400).json({ error: 'O arquivo enviado deve ser do formato PDF.' });
    }

    const parsedData = await parsePdfBuffer(req.file.buffer);

    res.json({
      filename: req.file.originalname,
      filesize: req.file.size,
      pages: parsedData.numpages,
      totalEvents: parsedData.totalDetected,
      globalEmails: parsedData.globalEmails || [],
      events: parsedData.events
    });
  } catch (err) {
    console.error('Erro na rota de extração do PDF:', err);
    res.status(500).json({ error: err.message });
  }
});

// Atualizar tarefa
router.put('/:id', (req, res) => {
  try {
    const {
      title,
      description = '',
      date,
      start_time = '',
      end_time = '',
      priority = 'media',
      status = 'pendente',
      category = 'Geral',
      color = '#3b82f6',
      notify_emails = [],
      reminder_minutes = 60
    } = req.body;

    const emailsJson = JSON.stringify(Array.isArray(notify_emails) ? notify_emails : safeParseEmails(notify_emails));

    const stmt = db.prepare(`
      UPDATE tasks SET
        title = ?,
        description = ?,
        date = ?,
        start_time = ?,
        end_time = ?,
        priority = ?,
        status = ?,
        category = ?,
        color = ?,
        notify_emails = ?,
        reminder_minutes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = stmt.run(
      title,
      description,
      date,
      start_time,
      end_time,
      priority,
      status,
      category,
      color,
      emailsJson,
      reminder_minutes,
      req.params.id
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Tarefa não encontrada para atualização' });
    }

    const updatedTask = formatTaskResponse(db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id));
    res.json(updatedTask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Atualização rápida de status
router.patch('/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status é obrigatório' });
    }

    const stmt = db.prepare('UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    const result = stmt.run(status, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    const task = formatTaskResponse(db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id));
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Deletar tarefa única
router.delete('/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
    const result = stmt.run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Tarefa não encontrada para exclusão' });
    }

    res.json({ message: 'Tarefa excluída com sucesso', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Disparo manual de notificação para a tarefa
router.post('/:id/notify', notifyRateLimiter, async (req, res) => {
  try {
    const { custom_emails, custom_note } = req.body;
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    const taskEmails = safeParseEmails(task.notify_emails);
    const recipients = (custom_emails && custom_emails.length > 0) ? custom_emails : taskEmails;

    if (!recipients || recipients.length === 0) {
      return res.status(400).json({ error: 'Nenhum e-mail destinatário associado a esta tarefa ou informado.' });
    }

    const result = await sendTaskNotification({
      task,
      recipients,
      customNote: custom_note || ''
    });

    res.json({
      message: 'Notificação enviada com sucesso!',
      result
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
