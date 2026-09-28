const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function createPdfFile(outputPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      info: {
        Title: 'Cronograma de Atividades e Eventos',
        Author: 'Sistema de Calendário & Notificações',
        Subject: 'Cronograma Oficial para Importação'
      }
    });

    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    const primaryColor = '#1e3a8a';   // Azul Escuro
    const secondaryColor = '#2563eb'; // Azul Royal
    const darkText = '#0f172a';       // Slate 900
    const lightText = '#475569';      // Slate 600
    const borderColor = '#cbd5e1';    // Slate 300

    // Cabeçalho Principal
    doc.rect(40, 40, 515, 65).fill('#f0f9ff');
    doc.rect(40, 40, 515, 65).stroke('#bae6fd');

    doc.fillColor(primaryColor).fontSize(16).font('Helvetica-Bold')
       .text('CRONOGRAMA DE ATIVIDADES E COMPROMISSOS', 55, 52);

    doc.fillColor(lightText).fontSize(9).font('Helvetica')
       .text('Documento Oficial de Planejamento e Agendamento de Tarefas', 55, 72)
       .text('Responsavel: coordenacao@empresa.com  |  Setor: Gestao de Projetos', 55, 85);

    doc.moveDown(3);

    // Título da Seção
    doc.fillColor(darkText).fontSize(12).font('Helvetica-Bold')
       .text('AGENDA DE EVENTOS PROGRAMADOS', 40, 125);

    const events = [
      {
        num: '1',
        date: '05/09/2026',
        time: '09:00 as 10:30',
        title: 'Reuniao de Alinhamento Semanal',
        cat: 'Reuniao',
        prio: 'Media',
        emails: 'ana.silva@empresa.com, carlos.oliveira@empresa.com',
        desc: 'Revisao das metas e prazos das entregas tecnicas da sprint.',
        color: '#3b82f6'
      },
      {
        num: '2',
        date: '10/09/2026',
        time: '14:00 as 16:00',
        title: 'Entrega do Prototipo do Sistema (Urgente)',
        cat: 'Projeto',
        prio: 'Urgente',
        emails: 'carlos.oliveira@empresa.com, diretoria@empresa.com',
        desc: 'Apresentacao executiva e validacao com os diretores e clientes.',
        color: '#ef4444'
      },
      {
        num: '3',
        date: '15/09/2026',
        time: '10:00 as 12:00',
        title: 'Workshop de Treinamento UI/UX',
        cat: 'Estudos',
        prio: 'Media',
        emails: 'juliana.costa@empresa.com',
        desc: 'Capacitacao pratica da equipe em interfaces modernas e responsivas.',
        color: '#06b6d4'
      },
      {
        num: '4',
        date: '22/09/2026',
        time: '15:30 as 17:00',
        title: 'Auditoria de Qualidade e Seguranca',
        cat: 'Trabalho',
        prio: 'Alta',
        emails: 'auditoria@empresa.com, ana.silva@empresa.com',
        desc: 'Verificacao de processos internos, conformidade de dados e seguranca.',
        color: '#10b981'
      },
      {
        num: '5',
        date: '28/09/2026',
        time: '08:30 as 11:30',
        title: 'Planejamento Estrategico do Trimestre',
        cat: 'Trabalho',
        prio: 'Alta',
        emails: 'diretoria@empresa.com',
        desc: 'Definicao dos objetivos OKRs e metas no Auditorio Principal.',
        color: '#8b5cf6'
      }
    ];

    let currentY = 150;

    events.forEach((evt) => {
      doc.rect(40, currentY, 515, 75).fill('#ffffff');
      doc.rect(40, currentY, 515, 75).stroke(borderColor);

      // Barra colorida
      doc.rect(40, currentY, 5, 75).fill(evt.color);

      // Linha 1: Título e Data/Hora
      doc.fillColor(darkText).fontSize(10.5).font('Helvetica-Bold')
         .text(`${evt.num}. Data: ${evt.date}  |  Horario: ${evt.time}  |  ${evt.title}`, 54, currentY + 10);

      // Linha 2: Descrição
      doc.fillColor(lightText).fontSize(9).font('Helvetica')
         .text(`Descricao: ${evt.desc}`, 54, currentY + 30);

      // Linha 3: E-mails
      doc.fillColor(secondaryColor).fontSize(9).font('Helvetica-Bold')
         .text(`Notificar: `, 54, currentY + 48, { continued: true })
         .font('Helvetica').fillColor('#334155')
         .text(evt.emails);

      currentY += 85;
    });

    // Rodapé limpo
    currentY += 15;
    doc.rect(40, currentY, 515, 30).fill('#f8fafc');
    doc.rect(40, currentY, 515, 30).stroke(borderColor);

    doc.fillColor('#64748b').fontSize(8.5).font('Helvetica')
       .text('Documento gerado para sincronizacao automatica com o Calendario e Notificacoes.', 54, currentY + 10);

    doc.end();

    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

async function buildAll() {
  const clientPublicDir = path.join(__dirname, '..', 'client', 'public');
  if (!fs.existsSync(clientPublicDir)) fs.mkdirSync(clientPublicDir, { recursive: true });

  const clientDistDir = path.join(__dirname, '..', 'client', 'dist');
  if (!fs.existsSync(clientDistDir)) fs.mkdirSync(clientDistDir, { recursive: true });

  const rootPath = path.join(__dirname, '..', 'modelo_ideal_cronograma.pdf');
  const clientPath = path.join(clientPublicDir, 'modelo_ideal_cronograma.pdf');
  const distPath = path.join(clientDistDir, 'modelo_ideal_cronograma.pdf');

  await createPdfFile(rootPath);
  await createPdfFile(clientPath);
  await createPdfFile(distPath);

  console.log('✅ Arquivo PDF padrão limpo gerado com sucesso em:');
  console.log(' - ' + rootPath);
  console.log(' - ' + clientPath);
  console.log(' - ' + distPath);
}

buildAll().catch(console.error);

module.exports = { createPdfFile };
