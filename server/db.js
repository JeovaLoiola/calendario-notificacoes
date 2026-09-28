const fs = require('fs');
const path = require('path');

const isServerless = Boolean(process.env.VERCEL || process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME);
const bundledDataFile = path.join(__dirname, '..', 'data', 'calendar_store.json');
const dataDir = isServerless ? path.join('/tmp', 'data') : path.join(__dirname, '..', 'data');

try {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
} catch (err) {
  console.warn('Aviso ao criar dataDir:', err.message);
}

const dbFilePath = path.join(dataDir, 'calendar_store.json');

// Prevenção contra Prototype Pollution
function safeAssign(target, source) {
  if (!source || typeof source !== 'object') return target;
  for (const key of Object.keys(source)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    target[key] = source[key];
  }
  return target;
}

// Estrutura de dados em memória persistida em JSON
class LocalDatabase {
  constructor(filePath) {
    this.filePath = filePath;
    this.data = {
      contacts: [],
      tasks: [],
      settings: {},
      notification_logs: [],
      counters: {
        contacts: 0,
        tasks: 0,
        notification_logs: 0
      }
    };
    this.load();
  }

  load() {
    // Se estiver em ambiente Serverless (Netlify/Vercel) e o arquivo temporário ainda não existir, carrega do arquivo empacotado
    if (isServerless && !fs.existsSync(this.filePath) && fs.existsSync(bundledDataFile)) {
      try {
        const bundledContent = fs.readFileSync(bundledDataFile, 'utf-8');
        fs.writeFileSync(this.filePath, bundledContent, 'utf-8');
      } catch (err) {
        console.warn('Aviso ao inicializar dados temporários em ambiente serverless:', err.message);
      }
    }

    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.data = JSON.parse(raw);
        if (!this.data.counters) {
          this.data.counters = {
            contacts: this.data.contacts ? this.data.contacts.reduce((max, c) => Math.max(max, c.id || 0), 0) : 0,
            tasks: this.data.tasks ? this.data.tasks.reduce((max, t) => Math.max(max, t.id || 0), 0) : 0,
            notification_logs: this.data.notification_logs ? this.data.notification_logs.reduce((max, n) => Math.max(max, n.id || 0), 0) : 0
          };
        }
        if (!Array.isArray(this.data.tasks)) this.data.tasks = [];
        if (!Array.isArray(this.data.contacts)) this.data.contacts = [];
        if (!Array.isArray(this.data.notification_logs)) this.data.notification_logs = [];
        if (!this.data.settings) this.data.settings = {};
      } catch (err) {
        console.error('Erro ao ler banco de dados JSON, iniciando novo:', err);
      }
    } else if (fs.existsSync(bundledDataFile)) {
      try {
        const raw = fs.readFileSync(bundledDataFile, 'utf-8');
        this.data = JSON.parse(raw);
      } catch (err) {
        this.seedInitialData();
      }
    } else {
      this.seedInitialData();
      this.save();
    }
  }

  save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Aviso ao salvar banco de dados local:', err.message);
    }
  }

  seedInitialData() {
    this.data.contacts = [];
    this.data.tasks = [];

    this.data.settings = {
      smtp_config: JSON.stringify({
        service: 'custom',
        host: '',
        port: 587,
        secure: false,
        user: '',
        pass: '',
        from_name: 'CALENDÁRIO OLINDINA',
        from_email: 'notificacoes@sistema.local',
        enable_simulation: true
      })
    };

    this.data.counters = {
      contacts: 0,
      tasks: 0,
      notification_logs: 0
    };
  }

  pragma() {}
  exec() {}

  transaction(fn) {
    return (...args) => {
      const res = fn(...args);
      this.save();
      return res;
    };
  }

  prepare(sql) {
    const normalized = sql.trim();
    const self = this;

    return {
      all(...params) {
        if (normalized.includes('FROM contacts')) {
          let list = [...self.data.contacts];
          if (normalized.includes('ORDER BY name ASC')) {
            list.sort((a, b) => a.name.localeCompare(b.name));
          }
          return list;
        }

        if (normalized.includes('FROM tasks')) {
          let list = [...self.data.tasks];

          if (normalized.includes('date = ?')) {
            const dateVal = params[0];
            list = list.filter(t => t.date === dateVal);
          }

          if (normalized.includes('WHERE 1=1')) {
            let paramIdx = 0;
            if (normalized.includes('date LIKE ?')) {
              const monthVal = params[paramIdx++].replace('%', '');
              list = list.filter(t => t.date && t.date.startsWith(monthVal));
            }
            if (normalized.includes('date = ?')) {
              const dateVal = params[paramIdx++];
              list = list.filter(t => t.date === dateVal);
            }
            if (normalized.includes('status = ?')) {
              const statusVal = params[paramIdx++];
              list = list.filter(t => t.status === statusVal);
            }
            if (normalized.includes('priority = ?')) {
              const priorityVal = params[paramIdx++];
              list = list.filter(t => t.priority === priorityVal);
            }
            if (normalized.includes('LIKE ?') && normalized.includes('title LIKE')) {
              const searchVal = params[paramIdx++].replace(/%/g, '').toLowerCase();
              paramIdx += 2;
              list = list.filter(t =>
                (t.title && t.title.toLowerCase().includes(searchVal)) ||
                (t.description && t.description.toLowerCase().includes(searchVal)) ||
                (t.category && t.category.toLowerCase().includes(searchVal))
              );
            }
          }

          if (normalized.includes('reminder_sent = 0')) {
            const dateVal = params[0];
            list = list.filter(t =>
              t.date === dateVal &&
              Number(t.reminder_sent) === 0 &&
              t.notify_emails &&
              t.notify_emails !== '[]' &&
              t.status !== 'concluida' &&
              t.status !== 'cancelada'
            );
          }

          list.sort((a, b) => {
            const dateCmp = (a.date || '').localeCompare(b.date || '');
            if (dateCmp !== 0) return dateCmp;
            return (a.start_time || '').localeCompare(b.start_time || '');
          });

          return list;
        }

        if (normalized.includes('FROM notification_logs')) {
          let list = [...self.data.notification_logs];
          list.sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at));
          const limit = params[0] || 50;
          return list.slice(0, limit);
        }

        return [];
      },

      get(...params) {
        if (normalized.includes('COUNT(*) as count FROM contacts')) {
          return { count: self.data.contacts.length };
        }
        if (normalized.includes('COUNT(*) as count FROM tasks')) {
          return { count: self.data.tasks.length };
        }

        if (normalized.includes('FROM settings WHERE key = ?')) {
          const key = params[0];
          return self.data.settings[key] ? { value: self.data.settings[key] } : undefined;
        }

        if (normalized.includes('FROM tasks WHERE id')) {
          let id = params[0];
          if (id === undefined) {
            const match = normalized.match(/WHERE\s+id\s*=\s*['"]?(\d+)['"]?/i);
            if (match) id = match[1];
          }
          return self.data.tasks.find(t => String(t.id) === String(id) || Number(t.id) === Number(id));
        }

        if (normalized.includes('FROM contacts WHERE id')) {
          let id = params[0];
          if (id === undefined) {
            const match = normalized.match(/WHERE\s+id\s*=\s*['"]?(\d+)['"]?/i);
            if (match) id = match[1];
          }
          return self.data.contacts.find(c => String(c.id) === String(id) || Number(c.id) === Number(id));
        }

        return undefined;
      },

      run(...params) {
        const nowIso = new Date().toISOString();

        // INSERT INTO contacts
        if (normalized.includes('INSERT INTO contacts')) {
          let contactObj = {
            name: '',
            email: '',
            phone: '',
            role: '',
            birth_date: '',
            department: '',
            birthday_sent_years: []
          };

          if (params.length === 1 && typeof params[0] === 'object' && !Array.isArray(params[0])) {
            safeAssign(contactObj, params[0]);
          } else {
            const colsMatch = normalized.match(/INSERT\s+INTO\s+contacts\s*\(([^)]+)\)/i);
            if (colsMatch) {
              const cols = colsMatch[1].split(',').map(c => c.trim().toLowerCase());
              cols.forEach((col, i) => {
                if (i < params.length) {
                  contactObj[col] = params[i];
                }
              });
            } else {
              const [name, email, phone, role, birth_date, department] = params;
              safeAssign(contactObj, { name, email, phone, role, birth_date, department });
            }
          }

          if (self.data.contacts.some(c => c.email && c.email.toLowerCase() === (contactObj.email || '').toLowerCase())) {
            throw new Error('UNIQUE constraint failed: contacts.email');
          }

          self.data.counters.contacts++;
          const newId = self.data.counters.contacts;
          const newContact = {
            id: newId,
            name: contactObj.name || '',
            email: (contactObj.email || '').toLowerCase(),
            phone: contactObj.phone || '',
            role: contactObj.role || '',
            birth_date: contactObj.birth_date || '',
            department: contactObj.department || '',
            birthday_sent_years: Array.isArray(contactObj.birthday_sent_years) ? contactObj.birthday_sent_years : [],
            created_at: nowIso,
            updated_at: nowIso
          };
          self.data.contacts.push(newContact);
          self.save();
          return { lastInsertRowid: newId, changes: 1 };
        }

        // UPDATE contacts
        if (normalized.includes('UPDATE contacts SET')) {
          const idParam = params[params.length - 1];
          const index = self.data.contacts.findIndex(c => String(c.id) === String(idParam) || Number(c.id) === Number(idParam));
          if (index === -1) return { changes: 0 };

          const oldContact = self.data.contacts[index];

          if (normalized.includes('birthday_sent_years = ?')) {
            const sentYearsVal = params[0];
            let parsedYears = [];
            if (Array.isArray(sentYearsVal)) parsedYears = sentYearsVal;
            else if (typeof sentYearsVal === 'string') {
              try { parsedYears = JSON.parse(sentYearsVal); } catch (e) { parsedYears = []; }
            }
            oldContact.birthday_sent_years = parsedYears;
            oldContact.updated_at = nowIso;
            self.save();
            return { changes: 1 };
          }

          let name, email, phone, role, birth_date, department;
          if (params.length === 5) {
            [name, email, phone, role] = params;
            birth_date = oldContact.birth_date || '';
            department = oldContact.department || '';
          } else if (params.length >= 7) {
            [name, email, phone, role, birth_date, department] = params;
          } else {
            [name, email, phone = '', role = '', birth_date = ''] = params;
            department = oldContact.department || '';
          }

          if (email && self.data.contacts.some(c => c.id !== oldContact.id && c.email.toLowerCase() === email.toLowerCase())) {
            throw new Error('UNIQUE constraint failed: contacts.email');
          }

          self.data.contacts[index] = {
            ...oldContact,
            name: name !== undefined ? name : oldContact.name,
            email: email !== undefined ? email.toLowerCase() : oldContact.email,
            phone: phone !== undefined ? phone : (oldContact.phone || ''),
            role: role !== undefined ? role : (oldContact.role || ''),
            birth_date: birth_date !== undefined ? birth_date : (oldContact.birth_date || ''),
            department: department !== undefined ? department : (oldContact.department || ''),
            updated_at: nowIso
          };
          self.save();
          return { changes: 1 };
        }

        // DELETE FROM contacts WHERE id = ?
        if (normalized.includes('DELETE FROM contacts WHERE id = ?')) {
          const targetId = params[0];
          const initialLen = self.data.contacts.length;
          self.data.contacts = self.data.contacts.filter(c => String(c.id) !== String(targetId) && Number(c.id) !== Number(targetId));
          self.save();
          return { changes: initialLen !== self.data.contacts.length ? 1 : 0 };
        }

        // INSERT INTO tasks
        if (normalized.includes('INSERT INTO tasks')) {
          let taskObj = {
            title: '',
            description: '',
            date: '',
            start_time: '',
            end_time: '',
            priority: 'media',
            status: 'pendente',
            category: 'Geral',
            color: '#3b82f6',
            notify_emails: '[]',
            reminder_minutes: 60,
            reminder_sent: 0,
            reminders_sent: []
          };

          if (params.length === 1 && typeof params[0] === 'object' && !Array.isArray(params[0])) {
            safeAssign(taskObj, params[0]);
          } else {
            const colsMatch = normalized.match(/INSERT\s+INTO\s+tasks\s*\(([^)]+)\)/i);
            if (colsMatch) {
              const cols = colsMatch[1].split(',').map(c => c.trim().toLowerCase());
              cols.forEach((col, i) => {
                if (i < params.length) {
                  taskObj[col] = params[i];
                }
              });
            } else {
              const [title, description, date, start_time, end_time, priority, status, category, color, notify_emails, reminder_minutes, reminders_sent] = params;
              safeAssign(taskObj, {
                title, description, date, start_time, end_time, priority, status, category, color, notify_emails, reminder_minutes, reminders_sent
              });
            }
          }

          let parsedRemindersSent = [];
          if (Array.isArray(taskObj.reminders_sent)) {
            parsedRemindersSent = taskObj.reminders_sent;
          } else if (typeof taskObj.reminders_sent === 'string') {
            try { parsedRemindersSent = JSON.parse(taskObj.reminders_sent); } catch (e) { parsedRemindersSent = []; }
          }

          let emailsStr = taskObj.notify_emails || '[]';
          if (Array.isArray(emailsStr)) {
            emailsStr = JSON.stringify(emailsStr);
          }

          self.data.counters.tasks++;
          const newId = self.data.counters.tasks;
          const newTask = {
            id: newId,
            title: taskObj.title || '',
            description: taskObj.description || '',
            date: taskObj.date || '',
            start_time: taskObj.start_time || '',
            end_time: taskObj.end_time || '',
            priority: taskObj.priority || 'media',
            status: taskObj.status || 'pendente',
            category: taskObj.category || 'Geral',
            color: taskObj.color || '#3b82f6',
            notify_emails: emailsStr,
            reminder_minutes: taskObj.reminder_minutes !== undefined ? Number(taskObj.reminder_minutes) : 60,
            reminder_sent: taskObj.reminder_sent ? Number(taskObj.reminder_sent) : 0,
            reminders_sent: parsedRemindersSent,
            created_at: nowIso,
            updated_at: nowIso
          };
          self.data.tasks.push(newTask);
          self.save();
          return { lastInsertRowid: newId, changes: 1 };
        }

        // UPDATE tasks SET reminders_sent = ?, reminder_sent = ? WHERE id = ?
        if (normalized.includes('UPDATE tasks SET') && normalized.includes('reminders_sent = ?')) {
          const targetId = params[params.length - 1];
          const task = self.data.tasks.find(t => String(t.id) === String(targetId) || Number(t.id) === Number(targetId));
          if (task) {
            const remindersSentVal = params[0];
            let parsed = [];
            if (Array.isArray(remindersSentVal)) parsed = remindersSentVal;
            else if (typeof remindersSentVal === 'string') {
              try { parsed = JSON.parse(remindersSentVal); } catch (e) { parsed = []; }
            }
            task.reminders_sent = parsed;
            if (params.length >= 3 && normalized.includes('reminder_sent = ?')) {
              task.reminder_sent = Number(params[1]);
            }
            task.updated_at = nowIso;
            self.save();
            return { changes: 1 };
          }
          return { changes: 0 };
        }

        // UPDATE tasks SET ... WHERE id = ?
        if (normalized.includes('UPDATE tasks SET') && normalized.includes('title = ?')) {
          const [title, description, date, start_time, end_time, priority, status, category, color, notify_emails, reminder_minutes, idParam] = params;
          const index = self.data.tasks.findIndex(t => String(t.id) === String(idParam) || Number(t.id) === Number(idParam));
          if (index === -1) return { changes: 0 };

          const oldTask = self.data.tasks[index];
          const dateChanged = oldTask.date !== date;

          self.data.tasks[index] = {
            ...oldTask,
            title,
            description: description || '',
            date,
            start_time: start_time || '',
            end_time: end_time || '',
            priority: priority || 'media',
            status: status || 'pendente',
            category: category || 'Geral',
            color: color || '#3b82f6',
            notify_emails: notify_emails || '[]',
            reminder_minutes: reminder_minutes !== undefined ? Number(reminder_minutes) : 60,
            // Se a data mudou, reseta o histórico de lembretes para que novas notificações funcionem
            reminders_sent: dateChanged ? [] : (oldTask.reminders_sent || []),
            reminder_sent: dateChanged ? 0 : (oldTask.reminder_sent || 0),
            updated_at: nowIso
          };
          self.save();
          return { changes: 1 };
        }

        // UPDATE tasks SET status = ?
        if (normalized.includes('UPDATE tasks SET status = ?')) {
          const [status, idParam] = params;
          const index = self.data.tasks.findIndex(t => String(t.id) === String(idParam) || Number(t.id) === Number(idParam));
          if (index === -1) return { changes: 0 };

          self.data.tasks[index].status = status;
          self.data.tasks[index].updated_at = nowIso;
          self.save();
          return { changes: 1 };
        }

        // UPDATE tasks SET reminder_sent = 1
        if (normalized.includes('UPDATE tasks SET reminder_sent = 1')) {
          const targetId = params[0];
          const task = self.data.tasks.find(t => String(t.id) === String(targetId) || Number(t.id) === Number(targetId));
          if (task) {
            task.reminder_sent = 1;
            if (!task.reminders_sent) task.reminders_sent = [];
            if (!task.reminders_sent.includes('day_of_event')) task.reminders_sent.push('day_of_event');
            task.updated_at = nowIso;
            self.save();
            return { changes: 1 };
          }
          return { changes: 0 };
        }

        // DELETE FROM tasks (Clear all tasks)
        if (normalized === 'DELETE FROM tasks') {
          const count = self.data.tasks.length;
          self.data.tasks = [];
          self.data.counters.tasks = 0;
          self.save();
          return { changes: count };
        }

        // DELETE FROM tasks WHERE id = ?
        if (normalized.includes('DELETE FROM tasks WHERE id = ?')) {
          const targetId = params[0];
          const initialLen = self.data.tasks.length;
          self.data.tasks = self.data.tasks.filter(t => String(t.id) !== String(targetId) && Number(t.id) !== Number(targetId));
          self.save();
          return { changes: initialLen !== self.data.tasks.length ? 1 : 0 };
        }

        // INSERT OR REPLACE INTO settings
        if (normalized.includes('settings')) {
          const [key, value] = params;
          self.data.settings[key] = value;
          self.save();
          return { changes: 1 };
        }

        // INSERT INTO notification_logs
        if (normalized.includes('INSERT INTO notification_logs')) {
          const [task_id, task_title, recipients, subject, status, message, preview_url, stage] = params;
          self.data.counters.notification_logs++;
          const newId = self.data.counters.notification_logs;
          self.data.notification_logs.push({
            id: newId,
            task_id: task_id ? Number(task_id) : null,
            task_title: task_title || '',
            recipients: recipients || '',
            subject: subject || '',
            status: status || 'sent',
            stage: stage || 'general',
            message: message || '',
            preview_url: preview_url || null,
            sent_at: nowIso
          });
          self.save();
          return { lastInsertRowid: newId, changes: 1 };
        }

        // DELETE FROM notification_logs
        if (normalized.includes('DELETE FROM notification_logs')) {
          const count = self.data.notification_logs.length;
          self.data.notification_logs = [];
          self.save();
          return { changes: count };
        }

        return { changes: 0 };
      }
    };
  }
}

const db = new LocalDatabase(dbFilePath);

module.exports = db;
