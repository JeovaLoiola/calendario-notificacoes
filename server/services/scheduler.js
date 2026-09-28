const db = require('../db');
const { sendTaskNotification, sendBirthdayNotification } = require('./mailer');
const { parseBirthDate, calculateBirthdayInfo } = require('./birthdayService');
const { generateBirthdayMessage } = require('./birthdayMessageGenerator');

function safeParseArray(val) {
  if (Array.isArray(val)) return val;
  if (!val) return [];
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (e) {
    return [];
  }
}

function parseDateOnly(dateStr) {
  if (!dateStr || !dateStr.includes('-')) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

/**
 * Verifica e envia felicitações automáticas de aniversário para funcionários no dia
 */
async function checkAndSendBirthdayGreetings() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  const contacts = db.prepare('SELECT * FROM contacts').all();
  const birthdayDispatches = [];

  for (const contact of contacts) {
    if (!contact.birth_date || !contact.email) continue;
    const parsed = parseBirthDate(contact.birth_date);
    if (!parsed) continue;

    // Verificar se é hoje
    if (parsed.month === currentMonth && parsed.day === currentDay) {
      const sentYears = safeParseArray(contact.birthday_sent_years || []);
      
      // Se ainda não foi enviado neste ano
      if (!sentYears.includes(currentYear)) {
        console.log(`🎂 [Scheduler] Aniversário hoje de ${contact.name}! Gerando mensagem e enviando felicitações...`);
        
        try {
          const uniqueMessage = generateBirthdayMessage(contact);
          const result = await sendBirthdayNotification({
            contact,
            message: uniqueMessage
          });

          // Marcar ano como enviado
          const updatedYears = [...sentYears, currentYear];
          db.prepare('UPDATE contacts SET birthday_sent_years = ? WHERE id = ?')
            .run(JSON.stringify(updatedYears), contact.id);

          birthdayDispatches.push({
            contactId: contact.id,
            name: contact.name,
            email: contact.email,
            status: 'success',
            result
          });
        } catch (err) {
          console.error(`❌ Erro ao enviar felicitações de aniversário para ${contact.name}:`, err);
          birthdayDispatches.push({
            contactId: contact.id,
            name: contact.name,
            email: contact.email,
            status: 'error',
            error: err.message
          });
        }
      }
    }
  }

  return birthdayDispatches;
}

/**
 * Executa a verificação e disparo de notificações automáticas em 4 etapas:
 * 1. Uma semana antes (7 dias antes)
 * 2. 5 dias antes
 * 3. 3 dias antes
 * 4. No dia do evento
 */
async function checkAndSendAutomatedNotifications() {
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

  // 1. Verificar aniversários de funcionários hoje
  const birthdayResults = await checkAndSendBirthdayGreetings();

  // 2. Buscar todas as tarefas ativas com e-mails cadastrados
  const allTasks = db.prepare('SELECT * FROM tasks').all();
  const activeTasks = allTasks.filter(t => 
    t.status !== 'concluida' && 
    t.status !== 'cancelada' &&
    t.date &&
    t.notify_emails &&
    t.notify_emails !== '[]'
  );

  const report = {
    timestamp: now.toISOString(),
    totalActiveTasksChecked: activeTasks.length,
    notificationsDispatched: 0,
    birthdayDispatches: birthdayResults,
    dispatches: []
  };

  for (const task of activeTasks) {
    const emails = safeParseArray(task.notify_emails).filter(e => e && e.includes('@'));
    if (emails.length === 0) continue;

    const taskDate = parseDateOnly(task.date);
    if (!taskDate) continue;

    // Diferença em dias inteiros (Data da Tarefa - Hoje)
    const diffTime = taskDate.getTime() - todayMidnight.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    const remindersSent = safeParseArray(task.reminders_sent || []);

    let stageToTrigger = null;
    let shouldSend = false;
    let customNote = '';

    // Etapa 1: 1 Semana Antes (7 dias antes)
    if (diffDays === 7 && !remindersSent.includes('7_days')) {
      stageToTrigger = '7_days';
      shouldSend = true;
      customNote = 'Lembrete Automático: Faltam 7 dias (1 semana) para a realização desta atividade.';
    }
    // Etapa 2: 5 Dias Antes
    else if (diffDays === 5 && !remindersSent.includes('5_days')) {
      stageToTrigger = '5_days';
      shouldSend = true;
      customNote = 'Lembrete Automático: Faltam 5 dias para o compromisso agendado.';
    }
    // Etapa 3: 3 Dias Antes
    else if (diffDays === 3 && !remindersSent.includes('3_days')) {
      stageToTrigger = '3_days';
      shouldSend = true;
      customNote = 'Lembrete Automático: Faltam 3 dias para esta atividade.';
    }
    // Etapa 4: No Dia do Evento (diffDays === 0)
    else if (diffDays === 0 && !remindersSent.includes('day_of_event')) {
      if (task.start_time) {
        const [hours, minutes] = task.start_time.split(':').map(Number);
        const taskTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
        const reminderMinutes = task.reminder_minutes !== null && task.reminder_minutes !== undefined
          ? Number(task.reminder_minutes)
          : 60;
        const notifyTime = new Date(taskTime.getTime() - reminderMinutes * 60 * 1000);

        if (now >= notifyTime && now <= new Date(taskTime.getTime() + 60 * 60 * 1000)) {
          stageToTrigger = 'day_of_event';
          shouldSend = true;
          customNote = `Lembrete Automático: Esta atividade está agendada para hoje às ${task.start_time}.`;
        }
      } else {
        stageToTrigger = 'day_of_event';
        shouldSend = true;
        customNote = 'Lembrete Automático: Esta atividade está agendada para o dia de hoje.';
      }
    }

    if (shouldSend && stageToTrigger) {
      console.log(`🔔 [Scheduler] Disparando notificação [${stageToTrigger}] para a tarefa #${task.id} ("${task.title}") para ${emails.join(', ')}`);
      
      try {
        const result = await sendTaskNotification({
          task,
          recipients: emails,
          customNote,
          stage: stageToTrigger
        });

        const updatedRemindersSent = [...remindersSent, stageToTrigger];
        const reminderSentFlag = stageToTrigger === 'day_of_event' ? 1 : Number(task.reminder_sent || 0);

        db.prepare('UPDATE tasks SET reminders_sent = ?, reminder_sent = ? WHERE id = ?')
          .run(JSON.stringify(updatedRemindersSent), reminderSentFlag, task.id);

        report.notificationsDispatched++;
        report.dispatches.push({
          taskId: task.id,
          taskTitle: task.title,
          taskDate: task.date,
          diffDays,
          stage: stageToTrigger,
          recipients: emails,
          status: 'success',
          result
        });
      } catch (err) {
        console.error(`❌ Erro ao disparar notificação [${stageToTrigger}] para tarefa ${task.id}:`, err);
        report.dispatches.push({
          taskId: task.id,
          taskTitle: task.title,
          taskDate: task.date,
          diffDays,
          stage: stageToTrigger,
          recipients: emails,
          status: 'error',
          error: err.message
        });
      }
    }
  }

  return report;
}

function startScheduler() {
  console.log('⏰ Agendador de lembretes automáticos e aniversários iniciado...');
  try {
    const cron = require('node-cron');
    // Executar a cada minuto
    cron.schedule('* * * * *', async () => {
      try {
        await checkAndSendAutomatedNotifications();
      } catch (err) {
        console.error('Erro na execução do agendador automático:', err);
      }
    });
  } catch (err) {
    console.warn('Agendador contínuo não disponível no ambiente atual:', err.message);
  }
}

module.exports = {
  startScheduler,
  checkAndSendAutomatedNotifications,
  checkAndSendBirthdayGreetings,
  safeParseArray,
  parseDateOnly
};
