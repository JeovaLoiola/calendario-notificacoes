const fs = require('fs');
const path = require('path');

// Gera um arquivo PDF válido e formatado em texto simples para teste de upload
function createSamplePdf() {
  const content = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 600 >>
stream
BT
/F1 16 Tf
50 720 Td
(CRONOGRAMA DE EVENTOS E REUNIOES) Tj
/F1 11 Tf
0 -30 Td
(Contato Geral: coordenacao@empresa.com) Tj
0 -30 Td
(10/09/2026 das 09:00 as 11:00 - Reuniao Geral de Planejamento) Tj
0 -18 Td
(Pauta: Alinhamento das metas. Notificar: ana.silva@empresa.com) Tj
0 -30 Td
(15/09/2026 14:30 - Entrega do Prototipo do Novo Aplicativo) Tj
0 -18 Td
(Urgente: Enviar links finais. Notificar: carlos.oliveira@empresa.com) Tj
0 -30 Td
(22 de setembro de 2026 as 16:00 - Workshop de Treinamento UI UX) Tj
0 -30 Td
(28/09/2026 10:00 - Auditoria de Seguranca e Conformidade) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000234 00000 n 
0000000305 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
960
%%EOF`;

  const outputPath = path.join(__dirname, 'cronograma_exemplo.pdf');
  fs.writeFileSync(outputPath, content);
  console.log(`✅ PDF de exemplo criado com sucesso em: ${outputPath}`);
}

createSamplePdf();
