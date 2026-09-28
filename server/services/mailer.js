const nodemailer = require('nodemailer');
const db = require('../db');

/**
 * Função de sanitização contra HTML Injection e XSS em e-mails
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getSmtpConfig() {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('smtp_config');
  if (row && row.value) {
    try {
      return JSON.parse(row.value);
    } catch (e) {
      console.error('Erro ao fazer parse do smtp_config:', e);
    }
  }
  return {
    service: 'custom',
    host: '',
    port: 587,
    secure: false,
    user: '',
    pass: '',
    from_name: 'CALENDÁRIO OLINDINA',
    from_email: 'notificacoes@sistema.local',
    enable_simulation: true
  };
}

function createTransporter(customConfig = null) {
  const config = customConfig || getSmtpConfig();

  // Se não estiver configurado usuário/host ou se modo simulação estiver ativado e sem credenciais
  if (!config.host && !config.user && config.enable_simulation) {
    return { isSimulated: true, config };
  }

  const transportOptions = {
    host: config.host || 'smtp.gmail.com',
    port: parseInt(config.port || 587, 10),
    secure: config.secure === true || config.port == 465,
    auth: {
      user: config.user,
      pass: config.pass
    },
    tls: {
      rejectUnauthorized: false
    }
  };

  if (config.service && config.service !== 'custom') {
    transportOptions.service = config.service;
  }

  const transporter = nodemailer.createTransport(transportOptions);
  return { isSimulated: false, transporter, config };
}

function getStageDetails(stage) {
  switch (stage) {
    case '7_days':
      return {
        prefix: '[1 Semana Antes] 📅',
        title: 'Lembrete de Antecedência (1 Semana Antes)',
        subtitle: 'Faltam exatamente 7 dias para a realização deste compromisso',
        badgeText: '1 SEMANA ANTES (7 DIAS)',
        badgeBg: '#dbeafe',
        badgeColor: '#1d4ed8',
        borderColor: '#3b82f6',
        bannerGradient: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
        alertMsg: '🗓️ Este é um lembrete automático informando que seu compromisso agendado ocorrerá em 1 semana (7 dias).'
      };
    case '5_days':
      return {
        prefix: '[Faltam 5 Dias] 🔔',
        title: 'Lembrete de Antecedência (Faltam 5 Dias)',
        subtitle: 'Faltam 5 dias para o compromisso agendado no calendário',
        badgeText: 'FALTAM 5 DIAS',
        badgeBg: '#ede9fe',
        badgeColor: '#6d28d9',
        borderColor: '#8b5cf6',
        bannerGradient: 'linear-gradient(135deg, #6d28d9 0%, #8b5cf6 100%)',
        alertMsg: '🔔 Este é um lembrete automático informando que faltam 5 dias para o seu compromisso.'
      };
    case '3_days':
      return {
        prefix: '[Faltam 3 Dias] ⚠️',
        title: 'Lembrete de Proximidade (Faltam 3 Dias)',
        subtitle: 'O seu evento está próximo: faltam apenas 3 dias',
        badgeText: 'FALTAM 3 DIAS',
        badgeBg: '#fef3c7',
        badgeColor: '#b45309',
        borderColor: '#f59e0b',
        bannerGradient: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
        alertMsg: '⚠️ Atenção: Seu compromisso agendado ocorrerá em 3 dias. Favor verificar os preparativos e pendências.'
      };
    case 'day_of_event':
      return {
        prefix: '[Hoje!] 🚨',
        title: 'Atenção: O Evento é Hoje!',
        subtitle: 'Compromisso agendado para a data de hoje',
        badgeText: 'NO DIA DO EVENTO (HOJE)',
        badgeBg: '#fee2e2',
        badgeColor: '#b91c1c',
        borderColor: '#ef4444',
        bannerGradient: 'linear-gradient(135deg, #b91c1c 0%, #ef4444 100%)',
        alertMsg: '🚨 Lembrete Importante: Este compromisso está agendado para hoje. Verifique o horário de início!'
      };
    case 'birthday':
      return {
        prefix: '[Feliz Aniversário!] 🎂🎉',
        title: 'Homenagem Especial de Aniversário',
        subtitle: 'Parabéns pelo seu dia especial em nossa comunidade escolar',
        badgeText: 'ANIVERSÁRIO 🎂',
        badgeBg: '#fce7f3',
        badgeColor: '#be185d',
        borderColor: '#ec4899',
        bannerGradient: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #f59e0b 100%)',
        alertMsg: '🎉 Hoje é um dia de muita alegria e celebração em nossa escola!'
      };
    case 'immediate':
      return {
        prefix: '[Agendamento Confirmado] 📋',
        title: 'Notificação de Agendamento',
        subtitle: 'Uma nova tarefa ou compromisso foi agendado para você',
        badgeText: 'NOVO AGENDAMENTO',
        badgeBg: '#d1fae5',
        badgeColor: '#047857',
        borderColor: '#10b981',
        bannerGradient: 'linear-gradient(135deg, #047857 0%, #10b981 100%)',
        alertMsg: '📋 Este evento foi recém-agendado no sistema de calendário.'
      };
    default:
      return {
        prefix: '[Lembrete] 📅',
        title: 'Notificação de Tarefa',
        subtitle: 'Lembrete e detalhes do seu compromisso agendado',
        badgeText: 'LEMBRETE',
        badgeBg: '#dbeafe',
        badgeColor: '#1d4ed8',
        borderColor: '#3b82f6',
        bannerGradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        alertMsg: ''
      };
  }
}

function generateEmailTemplate({ task, customNote, senderName, stage = 'general' }) {
  const stageInfo = getStageDetails(stage);

  const priorityColors = {
    baixa: { bg: '#e0f2fe', text: '#0369a1', label: 'Baixa' },
    media: { bg: '#fef3c7', text: '#b45309', label: 'Média' },
    alta: { bg: '#ffedd5', text: '#c2410c', label: 'Alta' },
    urgente: { bg: '#fee2e2', text: '#b91c1c', label: 'Urgente' }
  };

  const priorityInfo = priorityColors[task.priority] || priorityColors.media;

  const formattedDate = new Date(task.date + 'T00:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const timeDisplay = task.start_time
    ? `${escapeHtml(task.start_time)}${task.end_time ? ' às ' + escapeHtml(task.end_time) : ''}`
    : 'Dia inteiro';

  const safeTitle = escapeHtml(task.title);
  const safeCategory = escapeHtml(task.category || 'Geral');
  const safeDescription = escapeHtml(task.description);
  const safeCustomNote = escapeHtml(customNote);
  const safeSenderName = escapeHtml(senderName || 'CALENDÁRIO OLINDINA');

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
      .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.08); }
      .header { background: ${stageInfo.bannerGradient}; padding: 32px 28px; text-align: left; color: #ffffff; }
      .header-title { font-size: 22px; font-weight: 700; margin: 0 0 6px 0; letter-spacing: -0.5px; }
      .header-subtitle { font-size: 14px; margin: 0; opacity: 0.92; }
      .stage-pill { display: inline-block; padding: 4px 12px; background: rgba(255,255,255,0.22); border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; color: #ffffff; }
      .content { padding: 28px; }
      .stage-alert { background: ${stageInfo.badgeBg}; border-left: 4px solid ${stageInfo.borderColor}; padding: 14px 16px; border-radius: 8px; margin-bottom: 20px; font-size: 14px; font-weight: 600; color: ${stageInfo.badgeColor}; }
      .task-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
      .task-title { font-size: 19px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0; }
      .badge-group { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
      .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
      .badge-category { background: #ede9fe; color: #6d28d9; }
      .detail-row { display: flex; margin-bottom: 10px; font-size: 14px; line-height: 1.5; }
      .detail-label { font-weight: 600; color: #64748b; width: 120px; flex-shrink: 0; }
      .detail-value { color: #1e293b; }
      .description-box { margin-top: 16px; padding-top: 16px; border-top: 1px dashed #cbd5e1; font-size: 14px; color: #334155; white-space: pre-wrap; }
      .custom-note { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 14px; border-radius: 6px; margin-bottom: 20px; font-size: 14px; color: #1e40af; }
      .footer { background: #f8fafc; padding: 20px 28px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="stage-pill">${stageInfo.badgeText}</div>
        <h1 class="header-title">${stageInfo.title}</h1>
        <p class="header-subtitle">${stageInfo.subtitle}</p>
      </div>

      <div class="content">
        ${stageInfo.alertMsg ? `
          <div class="stage-alert">
            ${stageInfo.alertMsg}
          </div>
        ` : ''}

        ${safeCustomNote ? `
          <div class="custom-note">
            <strong>Observação:</strong> ${safeCustomNote}
          </div>
        ` : ''}

        <div class="task-card">
          <div class="badge-group">
            <span class="badge" style="background: ${priorityInfo.bg}; color: ${priorityInfo.text};">
              Prioridade ${priorityInfo.label}
            </span>
            <span class="badge badge-category">
              ${safeCategory}
            </span>
          </div>

          <h2 class="task-title">${safeTitle}</h2>

          <div class="detail-row">
            <span class="detail-label">🗓️ Data:</span>
            <span class="detail-value"><strong>${formattedDate}</strong></span>
          </div>

          <div class="detail-row">
            <span class="detail-label">⏰ Horário:</span>
            <span class="detail-value"><strong>${timeDisplay}</strong></span>
          </div>

          <div class="detail-row">
            <span class="detail-label">📌 Status:</span>
            <span class="detail-value">${task.status === 'concluida' ? '✅ Concluída' : task.status === 'em_andamento' ? '⏳ Em Andamento' : '🕒 Pendente'}</span>
          </div>

          ${safeDescription ? `
            <div class="description-box">
              <strong>Descrição / Detalhes:</strong><br/>
              ${safeDescription}
            </div>
          ` : ''}
        </div>
      </div>

      <div class="footer">
        Enviado automaticamente pelo sistema CALENDÁRIO OLINDINA.<br/>
        © ${new Date().getFullYear()} ${safeSenderName}
      </div>
    </div>
  </body>
  </html>
  `;
}

function generateBirthdayEmailTemplate({ contact, message, senderName }) {
  const safeName = escapeHtml(contact.name);
  const safeRole = escapeHtml(contact.role);
  const safeDepartment = escapeHtml(contact.department);
  const safeSenderName = escapeHtml(senderName || 'Nossa Escola');

  const formattedText = (message || '')
    .split('\n\n')
    .map(paragraph => `<p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.7; color: #334155;">${escapeHtml(paragraph).replace(/\n/g, '<br/>')}</p>`)
    .join('');

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fdf2f8; margin: 0; padding: 24px; color: #1e293b; }
      .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 15px 35px -5px rgba(236, 72, 153, 0.15); border: 1px solid #fbcfe8; }
      .header { background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #f59e0b 100%); padding: 36px 28px; text-align: center; color: #ffffff; }
      .header-icon { font-size: 40px; margin-bottom: 6px; }
      .header-title { font-size: 26px; font-weight: 800; margin: 0 0 6px 0; letter-spacing: -0.5px; }
      .header-subtitle { font-size: 15px; margin: 0; opacity: 0.95; font-weight: 500; }
      .stage-pill { display: inline-block; padding: 5px 16px; background: rgba(255,255,255,0.25); border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; color: #ffffff; border: 1px solid rgba(255,255,255,0.3); }
      .content { padding: 32px 28px; background: #ffffff; }
      .celebrant-badge { background: #fdf2f8; border: 1px solid #fbcfe8; border-radius: 14px; padding: 16px 20px; margin-bottom: 20px; }
      .celebrant-name { font-size: 18px; font-weight: 700; color: #9d174d; margin: 0; }
      .celebrant-role { font-size: 13px; color: #be185d; margin: 4px 0 0 0; font-weight: 500; }
      .balloon-banner { text-align: center; padding: 12px; background: linear-gradient(90deg, #fce7f3 0%, #ede9fe 50%, #fef3c7 100%); border-radius: 12px; margin-bottom: 20px; font-size: 14px; font-weight: 600; color: #6b21a8; }
      .message-box { background: #faf5ff; border-left: 4px solid #a855f7; border-radius: 12px; padding: 22px; margin-bottom: 24px; }
      .footer { background: #f8fafc; padding: 22px 28px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="stage-pill">🎉 HOMENAGEM DE ANIVERSÁRIO 🎂</div>
        <div class="header-icon">🎂🎈✨</div>
        <h1 class="header-title">Feliz Aniversário!</h1>
        <p class="header-subtitle">Homenagem especial da nossa comunidade escolar</p>
      </div>

      <div class="content">
        <div class="celebrant-badge">
          <h2 class="celebrant-name">${safeName}</h2>
          ${safeRole ? `<p class="celebrant-role">✨ ${safeRole}${safeDepartment ? ' • ' + safeDepartment : ''}</p>` : ''}
        </div>

        <div class="balloon-banner">
          🌟 Hoje celebramos a sua vida, seu talento e sua dedicação! 🌟
        </div>

        <div class="message-box">
          ${formattedText}
        </div>
      </div>

      <div class="footer">
        Com todo o carinho e admiração da equipe de <strong>${safeSenderName}</strong>.<br/>
        © ${new Date().getFullYear()} ${safeSenderName}
      </div>
    </div>
  </body>
  </html>
  `;
}

async function sendTaskNotification({ task, recipients, customNote = '', stage = 'general' }) {
  const recipientList = Array.isArray(recipients) ? recipients : [recipients];
  const validRecipients = recipientList.filter(r => r && r.includes('@'));

  if (validRecipients.length === 0) {
    throw new Error('Nenhum endereço de e-mail válido foi fornecido.');
  }

  const stageInfo = getStageDetails(stage);
  const { isSimulated, transporter, config } = createTransporter();
  const subject = `${stageInfo.prefix} ${task.title} - ${task.date}`;
  const htmlContent = generateEmailTemplate({
    task,
    customNote,
    senderName: config.from_name || 'CALENDÁRIO OLINDINA',
    stage
  });

  const fromAddress = `"${config.from_name || 'CALENDÁRIO OLINDINA'}" <${config.from_email || 'notificacoes@sistema.local'}>`;

  if (isSimulated) {
    const logMessage = `[MODO SIMULAÇÃO] E-mail simulado com sucesso para ${validRecipients.join(', ')}. (Etapa: ${stageInfo.badgeText})`;
    console.log(`✉️ [SIMULAÇÃO DE ENVIO] [${stage}] De: ${fromAddress} | Para: ${validRecipients.join(', ')} | Assunto: ${subject}`);
    
    // Salvar no log
    const logStmt = db.prepare(`
      INSERT INTO notification_logs (task_id, task_title, recipients, subject, status, message, preview_url, stage)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    logStmt.run(task.id || null, task.title, validRecipients.join(', '), subject, 'simulated', logMessage, null, stage);

    return {
      success: true,
      mode: 'simulated',
      stage,
      message: 'Notificação enviada com sucesso em modo simulação.',
      recipients: validRecipients
    };
  }

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: validRecipients.join(', '),
      subject: subject,
      html: htmlContent
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || null;

    // Registrar no histórico de logs
    const logStmt = db.prepare(`
      INSERT INTO notification_logs (task_id, task_title, recipients, subject, status, message, preview_url, stage)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    logStmt.run(
      task.id || null,
      task.title,
      validRecipients.join(', '),
      subject,
      'sent',
      `Enviado com sucesso! Message ID: ${info.messageId}`,
      previewUrl,
      stage
    );

    return {
      success: true,
      mode: 'real',
      stage,
      messageId: info.messageId,
      previewUrl,
      recipients: validRecipients
    };
  } catch (err) {
    console.error('Erro ao enviar e-mail:', err);

    // Salvar falha no log
    const logStmt = db.prepare(`
      INSERT INTO notification_logs (task_id, task_title, recipients, subject, status, message, preview_url, stage)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    logStmt.run(
      task.id || null,
      task.title,
      validRecipients.join(', '),
      subject,
      'failed',
      err.message || 'Erro desconhecido ao enviar',
      null,
      stage
    );

    throw err;
  }
}

async function sendBirthdayNotification({ contact, message, customSubject = '', additionalRecipients = [] }) {
  const recipientList = [contact.email, ...additionalRecipients];
  const validRecipients = recipientList.filter(r => r && r.includes('@'));

  if (validRecipients.length === 0) {
    throw new Error('O aniversariante ou a lista de destinatários não possui um e-mail válido.');
  }

  const { isSimulated, transporter, config } = createTransporter();
  const subject = customSubject || `🎂🎉 Feliz Aniversário, ${contact.name}! - Homenagem Especial`;
  const htmlContent = generateBirthdayEmailTemplate({
    contact,
    message,
    senderName: config.from_name || 'Comunidade Escolar'
  });

  const fromAddress = `"${config.from_name || 'CALENDÁRIO OLINDINA'}" <${config.from_email || 'notificacoes@sistema.local'}>`;

  if (isSimulated) {
    const logMessage = `[MODO SIMULAÇÃO] E-mail de aniversário simulado com sucesso para ${validRecipients.join(', ')}.`;
    console.log(`🎂✉️ [SIMULAÇÃO ANIVERSÁRIO] De: ${fromAddress} | Para: ${validRecipients.join(', ')} | Assunto: ${subject}`);
    
    const logStmt = db.prepare(`
      INSERT INTO notification_logs (task_id, task_title, recipients, subject, status, message, preview_url, stage)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    logStmt.run(null, `Aniversário: ${contact.name}`, validRecipients.join(', '), subject, 'simulated', logMessage, null, 'birthday');

    return {
      success: true,
      mode: 'simulated',
      stage: 'birthday',
      message: 'E-mail de aniversário enviado em modo simulação.',
      recipients: validRecipients
    };
  }

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: validRecipients.join(', '),
      subject: subject,
      html: htmlContent
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || null;

    const logStmt = db.prepare(`
      INSERT INTO notification_logs (task_id, task_title, recipients, subject, status, message, preview_url, stage)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    logStmt.run(
      null,
      `Aniversário: ${contact.name}`,
      validRecipients.join(', '),
      subject,
      'sent',
      `Enviado com sucesso! Message ID: ${info.messageId}`,
      previewUrl,
      'birthday'
    );

    return {
      success: true,
      mode: 'real',
      stage: 'birthday',
      messageId: info.messageId,
      previewUrl,
      recipients: validRecipients
    };
  } catch (err) {
    console.error('Erro ao enviar e-mail de aniversário:', err);

    const logStmt = db.prepare(`
      INSERT INTO notification_logs (task_id, task_title, recipients, subject, status, message, preview_url, stage)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    logStmt.run(
      null,
      `Aniversário: ${contact.name}`,
      validRecipients.join(', '),
      subject,
      'failed',
      err.message || 'Erro ao enviar e-mail de aniversário',
      null,
      'birthday'
    );

    throw err;
  }
}

async function sendTestEmail(toEmail, customConfig) {
  const { isSimulated, transporter, config } = createTransporter(customConfig);

  if (isSimulated) {
    return {
      success: true,
      mode: 'simulated',
      message: 'Teste bem-sucedido no modo simulação (nenhum servidor SMTP externo configurado).'
    };
  }

  const fromAddress = `"${config.from_name || 'CALENDÁRIO OLINDINA'}" <${config.from_email || config.user}>`;

  const info = await transporter.sendMail({
    from: fromAddress,
    to: toEmail,
    subject: '🧪 Teste de Conexão SMTP - CALENDÁRIO OLINDINA',
    html: `
      <div style="font-family: sans-serif; padding: 20px; background: #f8fafc; border-radius: 8px;">
        <h2 style="color: #2563eb;">✅ Configuração de E-mail Validada!</h2>
        <p>Se você recebeu este e-mail, as credenciais SMTP foram configuradas corretamente no seu sistema CALENDÁRIO OLINDINA.</p>
        <p style="color: #64748b; font-size: 13px;">Data do teste: ${new Date().toLocaleString('pt-BR')}</p>
      </div>
    `
  });

  return {
    success: true,
    mode: 'real',
    messageId: info.messageId,
    previewUrl: nodemailer.getTestMessageUrl(info) || null
  };
}

module.exports = {
  getSmtpConfig,
  sendTaskNotification,
  sendBirthdayNotification,
  sendTestEmail,
  escapeHtml
};
