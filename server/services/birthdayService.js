const db = require('../db');
const { generateBirthdayMessage } = require('./birthdayMessageGenerator');

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

/**
 * Normaliza e processa a data de nascimento do contato
 */
function parseBirthDate(birthDateStr) {
  if (!birthDateStr) return null;
  const clean = String(birthDateStr).trim();

  // Formato YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    const [year, month, day] = clean.split('-').map(Number);
    return { year, month, day, hasYear: true, raw: clean };
  }

  // Formato DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) {
    const [day, month, year] = clean.split('/').map(Number);
    return { year, month, day, hasYear: true, raw: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` };
  }

  // Formato MM-DD ou DD/MM
  if (/^\d{2}-\d{2}$/.test(clean)) {
    const [month, day] = clean.split('-').map(Number);
    return { year: null, month, day, hasYear: false, raw: clean };
  }

  if (/^\d{2}\/\d{2}$/.test(clean)) {
    const [day, month] = clean.split('/').map(Number);
    return { year: null, month, day, hasYear: false, raw: `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` };
  }

  return null;
}

/**
 * Calcula informações detalhadas do aniversário de um contato
 */
function calculateBirthdayInfo(contact, referenceDate = new Date()) {
  const parsed = parseBirthDate(contact.birth_date);
  if (!parsed) return null;

  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth() + 1; // 1-12
  const currentDay = referenceDate.getDate(); // 1-31

  const todayMidnight = new Date(currentYear, currentMonth - 1, currentDay, 0, 0, 0, 0);

  // Data do aniversário no ano corrente
  let birthdayThisYear = new Date(currentYear, parsed.month - 1, parsed.day, 0, 0, 0, 0);
  
  // Se o aniversário deste ano já passou (ontem ou antes), a próxima celebração é no ano seguinte
  let nextBirthdayYear = currentYear;
  if (birthdayThisYear.getTime() < todayMidnight.getTime()) {
    nextBirthdayYear = currentYear + 1;
  }

  const nextBirthdayDate = new Date(nextBirthdayYear, parsed.month - 1, parsed.day, 0, 0, 0, 0);
  const diffTime = nextBirthdayDate.getTime() - todayMidnight.getTime();
  const daysUntil = Math.round(diffTime / (1000 * 60 * 60 * 24));

  const isToday = (parsed.month === currentMonth && parsed.day === currentDay);
  const isThisMonth = (parsed.month === currentMonth);

  const monthName = MONTH_NAMES[parsed.month - 1];
  const formattedDayMonth = `${parsed.day} de ${monthName}`;

  let turningAge = null;
  if (parsed.hasYear) {
    turningAge = nextBirthdayYear - parsed.year;
  }

  const personalizedMessage = generateBirthdayMessage(contact);

  return {
    ...contact,
    birth_date_parsed: parsed,
    formattedDayMonth,
    monthName,
    month: parsed.month,
    day: parsed.day,
    year: parsed.year,
    nextBirthdayDateStr: `${nextBirthdayYear}-${String(parsed.month).padStart(2, '0')}-${String(parsed.day).padStart(2, '0')}`,
    daysUntil,
    isToday,
    isThisMonth,
    turningAge,
    personalizedMessage
  };
}

/**
 * Retorna todos os contatos com aniversários categorizados
 */
function getBirthdayList(referenceDate = new Date()) {
  const contacts = db.prepare('SELECT * FROM contacts').all();
  
  const birthdayContacts = contacts
    .map(c => calculateBirthdayInfo(c, referenceDate))
    .filter(Boolean);

  // Ordenar todos por mês e dia do calendário
  birthdayContacts.sort((a, b) => {
    if (a.month !== b.month) return a.month - b.month;
    return a.day - b.day;
  });

  const todayBirthdays = birthdayContacts.filter(b => b.isToday);
  
  // Aniversariantes próximos (nos próximos 30 dias), ordenados por dias restantes
  const upcomingBirthdays = [...birthdayContacts]
    .filter(b => b.daysUntil >= 0 && b.daysUntil <= 30)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const currentMonth = referenceDate.getMonth() + 1;
  const thisMonthBirthdays = birthdayContacts.filter(b => b.month === currentMonth);

  return {
    todayBirthdays,
    upcomingBirthdays,
    thisMonthBirthdays,
    allBirthdays: birthdayContacts,
    totalRegistered: birthdayContacts.length,
    currentDate: referenceDate.toISOString()
  };
}

/**
 * Cria ou sincroniza eventos/tarefas no calendário para os aniversários do ano
 */
function syncBirthdayTasks(year = new Date().getFullYear()) {
  const contacts = db.prepare('SELECT * FROM contacts').all();
  const allTasks = db.prepare('SELECT * FROM tasks').all();

  let createdCount = 0;
  let updatedCount = 0;

  for (const contact of contacts) {
    const parsed = parseBirthDate(contact.birth_date);
    if (!parsed) continue;

    const eventDate = `${year}-${String(parsed.month).padStart(2, '0')}-${String(parsed.day).padStart(2, '0')}`;
    const eventTitle = `🎂 Aniversário: ${contact.name}`;
    const customMessage = generateBirthdayMessage(contact);
    
    const description = `🎉 Data de Aniversário de ${contact.name}${contact.role ? ' (' + contact.role + ')' : ''}!\n\n` +
      `💌 Mensagem de Felicitações Gerada:\n"${customMessage}"\n\n` +
      `📧 E-mail do aniversariante: ${contact.email || 'Não informado'}\n` +
      (contact.phone ? `📱 Telefone: ${contact.phone}` : '');

    // Verificar se já existe evento desse aniversário para essa data
    const existingTask = allTasks.find(t => 
      t.category === 'Aniversário 🎂' && 
      (t.title === eventTitle || t.description?.includes(contact.email)) &&
      t.date === eventDate
    );

    const emailsToNotify = contact.email ? [contact.email] : [];

    if (!existingTask) {
      db.prepare(`
        INSERT INTO tasks (title, description, date, start_time, end_time, priority, status, category, color, notify_emails, reminder_minutes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        eventTitle,
        description,
        eventDate,
        '08:00',
        '09:00',
        'media',
        'pendente',
        'Aniversário 🎂',
        '#ec4899', // Rosa/Magenta festivo
        JSON.stringify(emailsToNotify),
        0 // No dia
      );
      createdCount++;
    } else {
      // Atualiza descrição com a mensagem atualizada se necessário
      db.prepare(`
        UPDATE tasks SET
          title = ?,
          description = ?,
          date = ?,
          priority = ?,
          category = ?,
          color = ?,
          notify_emails = ?
        WHERE id = ?
      `).run(
        eventTitle,
        description,
        eventDate,
        'media',
        'Aniversário 🎂',
        '#ec4899',
        JSON.stringify(emailsToNotify),
        existingTask.id
      );
      updatedCount++;
    }
  }

  return { createdCount, updatedCount, totalContacts: contacts.length, year };
}

module.exports = {
  parseBirthDate,
  calculateBirthdayInfo,
  getBirthdayList,
  syncBirthdayTasks
};
