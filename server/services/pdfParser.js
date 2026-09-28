const pdfParseModule = require('pdf-parse');

const MONTH_MAP = {
  'janeiro': '01', 'jan': '01',
  'fevereiro': '02', 'fev': '02',
  'março': '03', 'marco': '03', 'mar': '03',
  'abril': '04', 'abr': '04',
  'maio': '05', 'mai': '05',
  'junho': '06', 'jun': '06',
  'julho': '07', 'jul': '07',
  'agosto': '08', 'ago': '08',
  'setembro': '09', 'set': '09',
  'outubro': '10', 'out': '10',
  'novembro': '11', 'nov': '11',
  'dezembro': '12', 'dez': '12'
};

const CATEGORY_COLORS = {
  'Reunião': '#3b82f6',
  'Projeto': '#8b5cf6',
  'Trabalho': '#10b981',
  'Urgente': '#ef4444',
  'Pessoal': '#f59e0b',
  'Estudos': '#06b6d4',
  'Geral': '#64748b'
};

const KNOWN_CATEGORIES = ['Reunião', 'Reuniao', 'Projeto', 'Trabalho', 'Urgente', 'Pessoal', 'Estudos', 'Geral'];

function normalizeDate(rawDay, rawMonth, rawYear) {
  const currentYear = new Date().getFullYear();
  let year = rawYear ? parseInt(rawYear, 10) : currentYear;
  if (year < 100) year += 2000;

  let month = rawMonth;
  if (isNaN(month)) {
    const cleanMonth = String(rawMonth).toLowerCase().trim();
    month = MONTH_MAP[cleanMonth] || '01';
  } else {
    month = String(month).padStart(2, '0');
  }

  const day = String(rawDay).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeTime(rawHour, rawMinute) {
  const h = String(parseInt(rawHour, 10)).padStart(2, '0');
  const m = rawMinute ? String(parseInt(rawMinute, 10)).padStart(2, '0') : '00';
  return `${h}:${m}`;
}

function detectCategory(text) {
  const lower = text.toLowerCase();
  if (lower.includes('reunião') || lower.includes('reuniao') || lower.includes('meeting') || lower.includes('alinhamento') || lower.includes('call') || lower.includes('conferência') || lower.includes('conferencia')) {
    return 'Reunião';
  }
  if (lower.includes('projeto') || lower.includes('design') || lower.includes('desenvolvimento') || lower.includes('sprint') || lower.includes('deploy') || lower.includes('protótipo') || lower.includes('prototipo') || lower.includes('entrega') || lower.includes('lançamento') || lower.includes('lancamento')) {
    return 'Projeto';
  }
  if (lower.includes('urgente') || lower.includes('crítico') || lower.includes('critico') || lower.includes('prazo final') || lower.includes('deadline') || lower.includes('prioridade alta')) {
    return 'Urgente';
  }
  if (lower.includes('estudo') || lower.includes('aula') || lower.includes('curso') || lower.includes('prova') || lower.includes('exame') || lower.includes('treinamento') || lower.includes('workshop') || lower.includes('palestra') || lower.includes('seminário') || lower.includes('seminario') || lower.includes('simpósio') || lower.includes('simposio')) {
    return 'Estudos';
  }
  if (lower.includes('médico') || lower.includes('medico') || lower.includes('consulta') || lower.includes('pessoal') || lower.includes('aniversário') || lower.includes('aniversario') || lower.includes('férias') || lower.includes('ferias') || lower.includes('folga') || lower.includes('feriado')) {
    return 'Pessoal';
  }
  return 'Trabalho';
}

function detectPriority(text) {
  const lower = text.toLowerCase();
  if (lower.includes('urgente') || lower.includes('imediato') || lower.includes('prioridade alta') || lower.includes('alta prioridade') || lower.includes('prazo fatal')) {
    return 'urgente';
  }
  if (lower.includes('importante') || lower.includes('atenção') || lower.includes('atencao') || lower.includes('alta') || lower.includes('prioritário') || lower.includes('prioritario')) {
    return 'alta';
  }
  if (lower.includes('baixa prioridade') || lower.includes('prioridade baixa') || lower.includes('opcional') || lower.includes('desejável') || lower.includes('desejavel')) {
    return 'baixa';
  }
  return 'media';
}

function extractEmails(text) {
  if (!text) return [];
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
  const matches = text.match(emailRegex) || [];
  return [...new Set(matches.map(e => e.toLowerCase()))];
}

function cleanTitleString(str, detectedCat = '') {
  if (!str) return 'Compromisso Agendado';

  let cleaned = str;

  // Remover e-mails
  cleaned = cleaned.replace(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi, '');

  // Remover prefixos comuns de cabeçalhos como "Data: ... | Horário: ... |"
  cleaned = cleaned.replace(/\b(?:data|horário|horario|hora|período|periodo|prazo)\s*[:\-–—]?\s*/gi, '');

  // Remover tags de instrução comuns como "Enviar dados para", "Notificar:", "Responsável:", "Contato:", "Pauta:"
  cleaned = cleaned.replace(/\b(?:enviar dados para|enviar para|notificar|responsável|responsavel|contato|local|sala|pauta|descricao|descrição)\s*[:\-–—]?\s*$/gi, '');
  cleaned = cleaned.replace(/\b(?:enviar dados para|enviar para|notificar|responsável|responsavel|contato)\s*[:\-–—]?\s*/gi, '');

  // Remover marcações de urgência/prioridade
  cleaned = cleaned.replace(/\((?:urgente|alta prioridade|importante|baixa prioridade)\)/gi, '');
  cleaned = cleaned.replace(/\[(?:urgente|alta prioridade|importante|baixa prioridade)\]/gi, '');

  // Remover categorias no início do título
  for (const cat of KNOWN_CATEGORIES) {
    const catRegex = new RegExp(`^${cat}\\s+`, 'i');
    if (catRegex.test(cleaned)) {
      const rest = cleaned.replace(catRegex, '').trim();
      if (rest.length > 2) {
        cleaned = rest;
      }
    }
  }

  // Remover palavras de ligação finais
  cleaned = cleaned.replace(/\b(?:em|no dia|na data|às|as|para o dia|data limite|prazo limite|prazo|data|período|periodo)\s*[:\-–—]?\s*$/gi, '');

  // Remover pontuação inicial e final
  cleaned = cleaned
    .replace(/^[\s\d\.\-\:\•\*\–\—\>\|\)\(\[\]]+/, '')
    .replace(/[\s\-\:\•\*\–\—\>\|\,\.\;]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned || 'Compromisso Agendado';
}

/**
 * Busca e extrai todas as informações de horário em um texto
 */
function extractTimesFromText(text) {
  let startTime = null;
  let endTime = null;

  const rangeRegexes = [
    /(?:das\s+|de\s+)?(\d{1,2})[:h](\d{2})?(?:h|min|hs)?\s*(?:às|as|ate|até|-|a)\s*(\d{1,2})[:h](\d{2})?(?:h|min|hs)?/i,
    /(\d{1,2}):(\d{2})\s*(?:-|às|as|a)\s*(\d{1,2}):(\d{2})/i,
    /(\d{1,2})\s*h(?:oras?)?\s*(?:-|às|as|a)\s*(\d{1,2})\s*h(?:oras?)?/i
  ];

  for (const regex of rangeRegexes) {
    const m = text.match(regex);
    if (m) {
      startTime = normalizeTime(m[1], m[2]);
      endTime = normalizeTime(m[3], m[4]);
      return { startTime, endTime, matchedString: m[0] };
    }
  }

  const singleRegexes = [
    /(?:às\s+|as\s+|horário:\s*|horario:\s*|hora:\s*|às\s*|as\s*|\b)(\d{1,2}):(\d{2})(?:h|min|hs)?\b/i,
    /(?:às\s+|as\s+|horário:\s*|horario:\s*|hora:\s*|\b)(\d{1,2})h(\d{2})?(?:min|m)?\b/i,
    /(?:às\s+|as\s+)(\d{1,2})\s*(?:h|horas?)\b/i
  ];

  for (const regex of singleRegexes) {
    const m = text.match(regex);
    if (m) {
      startTime = normalizeTime(m[1], m[2]);
      return { startTime, endTime: '', matchedString: m[0] };
    }
  }

  return { startTime: '09:00', endTime: '', matchedString: null };
}

/**
 * Encontra todas as datas em uma string com suas posições
 */
function findDatesInString(str) {
  const dates = [];

  // Padrão 1: Faixas textuais de data (ex: 08 a 10 de setembro de 2026, de 15 a 20 de outubro)
  const rangeTextualRegex = /\b(?:de\s+|dia\s+)?(\d{1,2})\s*(?:a|até|ate|-)\s*(\d{1,2})\s+de\s+([a-zç]+)(?:\s+de\s+(\d{2,4}))?\b/gi;
  let match;
  while ((match = rangeTextualRegex.exec(str)) !== null) {
    const dStart = match[1];
    const dEnd = match[2];
    const mName = match[3].toLowerCase();
    const y = match[4];
    if (MONTH_MAP[mName] && parseInt(dStart, 10) >= 1 && parseInt(dStart, 10) <= 31) {
      dates.push({
        formatted: normalizeDate(dStart, mName, y),
        raw: match[0],
        index: match.index,
        length: match[0].length,
        note: `Período: dia ${dStart} até dia ${dEnd} de ${match[3]}`
      });
    }
  }

  // Padrão 2: ISO YYYY-MM-DD ou YYYY/MM/DD
  const isoRegex = /\b(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\b/g;
  while ((match = isoRegex.exec(str)) !== null) {
    const y = match[1];
    const m = match[2];
    const d = match[3];
    if (parseInt(m, 10) >= 1 && parseInt(m, 10) <= 12 && parseInt(d, 10) >= 1 && parseInt(d, 10) <= 31) {
      dates.push({
        formatted: normalizeDate(d, m, y),
        raw: match[0],
        index: match.index,
        length: match[0].length
      });
    }
  }

  // Padrão 3: Textual simples (ex: 25 de setembro de 2026, 12 de outubro, dia 15 de mar)
  const textualRegex = /\b(?:dia\s+)?(\d{1,2})\s+de\s+([a-zç]+)(?:\s+de\s+(\d{2,4}))?\b/gi;
  while ((match = textualRegex.exec(str)) !== null) {
    const d = match[1];
    const mName = match[2].toLowerCase();
    const y = match[3];
    if (MONTH_MAP[mName] && parseInt(d, 10) >= 1 && parseInt(d, 10) <= 31) {
      if (!dates.some(existing => Math.abs(existing.index - match.index) < 6)) {
        dates.push({
          formatted: normalizeDate(d, mName, y),
          raw: match[0],
          index: match.index,
          length: match[0].length
        });
      }
    }
  }

  // Padrão 4: DD/mmm/YYYY ou DD-mmm-YYYY ou DD/mmm ou DD-mmm (ex: 12/out, 15-set-2026)
  const monthAbbrRegex = /\b(\d{1,2})[\/\-\.]([a-zç]{3,9})(?:[\/\-\.](\d{2,4}))?\b/gi;
  while ((match = monthAbbrRegex.exec(str)) !== null) {
    const d = match[1];
    const mName = match[2].toLowerCase();
    const y = match[3];
    if (MONTH_MAP[mName] && parseInt(d, 10) >= 1 && parseInt(d, 10) <= 31) {
      if (!dates.some(existing => Math.abs(existing.index - match.index) < 5)) {
        dates.push({
          formatted: normalizeDate(d, mName, y),
          raw: match[0],
          index: match.index,
          length: match[0].length
        });
      }
    }
  }

  // Padrão 5: Numérico DD/MM/AAAA, DD-MM-AAAA, DD.MM.AAAA, DD/MM, DD-MM
  const numRegex = /(?:^|[^\d:])(\d{1,2})[\/\-\.](\d{1,2})(?:[\/\-\.](\d{2,4}))?(?=[^\d:]|$)/g;
  while ((match = numRegex.exec(str)) !== null) {
    const fullMatch = match[0];
    const d = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const y = match[3];

    const matchStart = match.index + (fullMatch.length - match[1].length - match[2].length - (y ? y.length + 2 : 1));
    const isAdjacentToColon = (matchStart > 0 && str[matchStart - 1] === ':') ||
                              (matchStart + match[0].length < str.length && str[matchStart + match[0].length] === ':');

    if (!isAdjacentToColon && d >= 1 && d <= 31 && m >= 1 && m <= 12) {
      if (!dates.some(existing => Math.abs(existing.index - match.index) < 5)) {
        dates.push({
          formatted: normalizeDate(d, m, y),
          raw: match[1] + (str.includes('/') ? '/' : '-') + match[2] + (y ? (str.includes('/') ? '/' : '-') + y : ''),
          index: match.index,
          length: match[0].length
        });
      }
    }
  }

  dates.sort((a, b) => a.index - b.index);
  return dates;
}

/**
 * Analisa o texto extraído de um PDF e detecta tarefas/eventos com máxima abrangência
 */
function parseEventsFromText(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return { events: [], totalDetected: 0, globalEmails: [] };
  }

  const globalEmails = extractEmails(rawText);

  const rawLines = rawText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith('-- ') && !l.endsWith(' --'));

  const events = [];

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];

    // Ignorar linhas de cabeçalho ou rodapés explicativos de guia/instruções
    if (
      line.match(/^(?:página|page|relatório gerado|impresso em|emitido em|guia|dicas|instruções|instrucoes|instrucao|como preencher|legenda)\b/i) ||
      line.match(/^(?:data|horário|atividade|responsável|local|descrição)\s*\|?\s*(?:data|horário|atividade|responsável|local|descrição)/i) ||
      line.match(/\b(?:utilize o formato|como formatar|guia rápido|guia rapido|boas práticas|boas praticas)\b/i) ||
      line.match(/\(ex:\s*\d+/i)
    ) {
      continue;
    }

    const datesInLine = findDatesInString(line);

    if (datesInLine.length > 0) {
      datesInLine.forEach((dateObj, dIdx) => {
        let eventLine = line;
        
        if (datesInLine.length > 1) {
          const nextIndex = datesInLine[dIdx + 1] ? datesInLine[dIdx + 1].index : line.length;
          eventLine = line.substring(dateObj.index, nextIndex);
        }

        let timeInfo = extractTimesFromText(eventLine);

        let blockDescription = [];
        let lookahead = 1;
        while (i + lookahead < rawLines.length && lookahead <= 3) {
          const nextLine = rawLines[i + lookahead];

          if (
            nextLine.match(/^(?:guia de boas|como preencher|página|page)\b/i) ||
            nextLine.match(/^(?:\d+|[a-z])[\.\)]\s*(?:formato|horário|horario|data|emails|e-mails|prioridade)/i)
          ) {
            break;
          }

          const nextDates = findDatesInString(nextLine);
          if (nextDates.length > 0) break;

          if (timeInfo.startTime === '09:00' && !timeInfo.matchedString) {
            const nextTime = extractTimesFromText(nextLine);
            if (nextTime.matchedString) {
              timeInfo = nextTime;
            }
          }

          blockDescription.push(nextLine);
          lookahead++;
        }

        let titleCandidate = eventLine.replace(dateObj.raw, ' ');
        if (timeInfo.matchedString) {
          titleCandidate = titleCandidate.replace(timeInfo.matchedString, ' ');
        }

        const emailsInEvent = extractEmails(eventLine + ' ' + blockDescription.join(' '));
        emailsInEvent.forEach(em => {
          titleCandidate = titleCandidate.replace(em, ' ');
        });

        const fullContext = eventLine + ' ' + blockDescription.join(' ');
        const category = detectCategory(fullContext);
        const priority = detectPriority(fullContext);

        let cleanTitle = cleanTitleString(titleCandidate, category);

        if (cleanTitle.length < 3 || cleanTitle === 'Compromisso Agendado') {
          if (blockDescription.length > 0) {
            const firstDescLine = blockDescription[0];
            if (!firstDescLine.match(/^(?:horário|hora|horario|das|às|as)\b/i)) {
              cleanTitle = cleanTitleString(firstDescLine, category);
            }
          }
        }

        const cleanDescLines = blockDescription.filter(l => !l.match(/^[\-\=\_]{3,}$/));
        let descText = cleanDescLines.length > 0
          ? `Importado do PDF.\n${cleanDescLines.join('\n')}`
          : `Importado do documento PDF.\nLinha original: "${line}"`;

        if (dateObj.note) {
          descText += `\n${dateObj.note}`;
        }

        const isDuplicate = events.some(e => e.date === dateObj.formatted && e.title.toLowerCase() === cleanTitle.toLowerCase());

        if (!isDuplicate) {
          events.push({
            id: `pdf-evt-${events.length + 1}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            title: cleanTitle,
            description: descText,
            date: dateObj.formatted,
            start_time: timeInfo.startTime,
            end_time: timeInfo.endTime || '',
            priority: priority,
            status: 'pendente',
            category: category,
            color: CATEGORY_COLORS[category] || '#3b82f6',
            notify_emails: emailsInEvent,
            reminder_minutes: 60,
            selected: true
          });
        }
      });
    }
  }

  if (events.length === 0 && rawLines.length > 0) {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    for (const line of rawLines.slice(0, 20)) {
      if (line.length > 4 && !line.match(/^(?:página|page|sumário|índice|relatório|guia)\b/i)) {
        const timeInfo = extractTimesFromText(line);
        const cat = detectCategory(line);
        const prio = detectPriority(line);
        const emails = extractEmails(line);

        events.push({
          id: `pdf-evt-${events.length + 1}-${Date.now()}`,
          title: cleanTitleString(line, cat).substring(0, 100),
          description: `Item extraído do PDF:\n${line}`,
          date: todayStr,
          start_time: timeInfo.startTime || '10:00',
          end_time: timeInfo.endTime || '',
          priority: prio,
          status: 'pendente',
          category: cat,
          color: CATEGORY_COLORS[cat] || '#3b82f6',
          notify_emails: emails,
          reminder_minutes: 60,
          selected: true
        });
      }
    }
  }

  events.sort((a, b) => {
    const dateCmp = a.date.localeCompare(b.date);
    if (dateCmp !== 0) return dateCmp;
    return (a.start_time || '').localeCompare(b.start_time || '');
  });

  return {
    events,
    totalDetected: events.length,
    globalEmails
  };
}

/**
 * Processa um buffer de arquivo PDF agregando todas as páginas
 */
async function parsePdfBuffer(buffer) {
  try {
    let rawText = '';
    let numpages = 1;

    if (pdfParseModule.PDFParse) {
      const parser = new pdfParseModule.PDFParse({ data: buffer });
      await parser.load();
      const textResult = await parser.getText();
      
      if (textResult && Array.isArray(textResult.pages) && textResult.pages.length > 0) {
        rawText = textResult.pages.map(p => p.text || '').join('\n\n');
        numpages = textResult.pages.length;
      } else {
        rawText = typeof textResult === 'string' ? textResult : (textResult?.text || '');
      }

      const infoResult = await parser.getInfo().catch(() => ({}));
      if (infoResult?.total) numpages = infoResult.total;
      parser.destroy();
    } else if (typeof pdfParseModule === 'function') {
      const data = await pdfParseModule(buffer);
      rawText = data.text;
      numpages = data.numpages || 1;
    } else if (pdfParseModule.default && typeof pdfParseModule.default === 'function') {
      const data = await pdfParseModule.default(buffer);
      rawText = data.text;
      numpages = data.numpages || 1;
    }

    const result = parseEventsFromText(rawText);
    return {
      numpages,
      ...result
    };
  } catch (err) {
    console.error('Erro ao processar PDF:', err);
    throw new Error('Falha ao ler o conteúdo do arquivo PDF: ' + err.message);
  }
}

module.exports = {
  parsePdfBuffer,
  parseEventsFromText
};
