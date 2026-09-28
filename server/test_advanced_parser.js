const { parseEventsFromText } = require('./services/pdfParser');

const testCases = [
  {
    name: 'Tabela com colunas',
    text: `
DATA        HORÁRIO     ATIVIDADE                                 RESPONSÁVEL
01/09/2026  08:00       Abertura do Evento                        diretoria@empresa.com
02/09/2026  10:30-12:00 Apresentação de Resultados                marcos@empresa.com
03/09/2026  14h00       Planejamento Estratégico                  julia@empresa.com
04/09/2026  16:30       Encerramento e Próximos Passos
`
  },
  {
    name: 'Blocos de múltiplas linhas com data isolada',
    text: `
CRONOGRAMA DE PROVAS

15/09/2026
Prova de Matemática Aplicada
Horário: 08:00 às 10:00
Local: Sala 204

17/09/2026
Prova de Algoritmos e Estruturas de Dados
Horário: 10:30 às 12:30
`
  },
  {
    name: 'Título antes da data e formatos textuais',
    text: `
- Reunião de Kick-off do Projeto Alfa: 18/09/2026 às 09:00 (Urgente). Enviar dados para contato@cliente.com
- Workshop de Inovação e Design Thinking em 25 de setembro de 2026 às 15h
- Entrega Final de Relatório Financeiro - Prazo limite: 30/09/2026 18:00
`
  },
  {
    name: 'Datas sem ano (DD/MM e DD/Mês)',
    text: `
1. 05/10 das 14h às 16h - Alinhamento de Metas Trimestrais
2. 12/out às 09:00 - Feriado / Planejamento
3. 20-10-2026 11:30 - Demonstração do Sistema
`
  }
];

console.log('🧪 Testando casos variados de extração de PDF...');

let allPassed = true;

for (const tc of testCases) {
  console.log(`\n=== Caso: ${tc.name} ===`);
  const result = parseEventsFromText(tc.text);
  console.log(`Eventos detectados: ${result.totalDetected}`);
  result.events.forEach((evt, idx) => {
    console.log(`  [${idx + 1}] ${evt.date} (${evt.start_time}${evt.end_time ? '-' + evt.end_time : ''}): "${evt.title}" [${evt.category}]`);
  });
}
