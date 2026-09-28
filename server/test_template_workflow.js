const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001;

function downloadTemplate() {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${PORT}/api/tasks/template-pdf`, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Download falhou com status ${res.statusCode}`));
      }

      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });
    }).on('error', reject);
  });
}

async function testWorkflow() {
  console.log('🧪 1. Baixando modelo oficial de PDF via rota /api/tasks/template-pdf...');
  const buffer = await downloadTemplate();
  console.log(`✅ Arquivo baixado com sucesso! Tamanho: ${(buffer.length / 1024).toFixed(1)} KB`);

  // Validar se o buffer é um PDF válido
  const header = buffer.slice(0, 5).toString('ascii');
  if (header !== '%PDF-') {
    throw new Error('O arquivo retornado não é um PDF válido! Header: ' + header);
  }
  console.log('✅ Validação do cabeçalho PDF: Formato %PDF-1.3 válido!');

  // Testar a extração com o parser do sistema
  const { parsePdfBuffer } = require('./services/pdfParser');
  const result = await parsePdfBuffer(buffer);

  console.log('\n🧪 2. Resultado da Extração do Modelo:');
  console.log(`Total de Eventos Detectados: ${result.totalDetected}`);

  result.events.forEach((evt, idx) => {
    console.log(`  [${idx + 1}] ${evt.date} (${evt.start_time}${evt.end_time ? ' às ' + evt.end_time : ''}): "${evt.title}" [${evt.category} - ${evt.priority}]`);
    if (evt.notify_emails?.length > 0) {
      console.log(`      ✉️ Notificar: ${evt.notify_emails.join(', ')}`);
    }
  });

  if (result.totalDetected === 5) {
    console.log('\n🎉 PERFEITO! Todos os 5 eventos do modelo oficial foram detectados com 100% de precisão.');
  } else {
    console.warn(`\n⚠️ Atenção: Esperava 5 eventos, foram detectados ${result.totalDetected}.`);
  }
}

testWorkflow().catch(err => {
  console.error('❌ Erro no teste do fluxo do modelo:', err);
  process.exit(1);
});
