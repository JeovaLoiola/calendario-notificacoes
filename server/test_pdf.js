const { parseEventsFromText, parsePdfBuffer } = require('./services/pdfParser');

async function testPdfParsing() {
  console.log('🧪 Testando extração inteligente de texto...');

  const sampleDocumentText = `
CRONOGRAMA DE ATIVIDADES E REUNIÕES - SETEMBRO 2026
Responsável: coordenacao@empresa.com

1. 10/09/2026 das 09:00 às 11:00 - Reunião Geral de Planejamento Estratégico
Pauta: Apresentação das métricas do trimestre e alocação de recursos. Contato: ana.silva@empresa.com

2. 15/09/2026 14:30 - Entrega do Protótipo do Novo Aplicativo (Urgente)
Desenvolvedores devem enviar o link de acesso antes das 14h. Notificar: carlos.oliveira@empresa.com

3. 22 de setembro de 2026 às 16:00 - Workshop de Treinamento UI/UX
Participação de toda a equipe de design e desenvolvimento.

4. 28/09/2026 - Auditoria de Segurança e Conformidade
Revisão de logs e acessos aos servidores de produção.
`;

  const result = parseEventsFromText(sampleDocumentText);

  console.log(`✅ Eventos detectados: ${result.totalDetected}`);
  console.log(`✅ E-mails globais detectados: ${result.globalEmails.join(', ')}`);

  result.events.forEach((evt, i) => {
    console.log(`\n--- Evento #${i + 1} ---`);
    console.log(`Título: ${evt.title}`);
    console.log(`Data: ${evt.date}`);
    console.log(`Horário: ${evt.start_time} ${evt.end_time ? 'até ' + evt.end_time : ''}`);
    console.log(`Categoria: ${evt.category} | Prioridade: ${evt.priority}`);
    console.log(`E-mails: ${evt.notify_emails.join(', ') || 'Nenhum'}`);
  });

  if (result.totalDetected === 4) {
    console.log('\n🎉 TESTE DE PARSER PASSOU COM 100% DE SUCESSO!');
  } else {
    console.warn('\n⚠️ Alguns eventos podem não ter sido identificados corretamente.');
  }
}

testPdfParsing().catch(err => {
  console.error('❌ Erro no teste:', err);
});
