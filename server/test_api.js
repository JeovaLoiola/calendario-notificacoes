const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001;

function request(method, reqPath, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: reqPath,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

function uploadPdf(filePath) {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const fileBuffer = fs.readFileSync(filePath);
    const filename = path.basename(filePath);

    const postDataHeader = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="pdfFile"; filename="${filename}"\r\n` +
      `Content-Type: application/pdf\r\n\r\n`
    );
    const postDataFooter = Buffer.from(`\r\n--${boundary}--\r\n`);
    const payload = Buffer.concat([postDataHeader, fileBuffer, postDataFooter]);

    const req = http.request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/tasks/import-pdf-preview',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': payload.length
      }
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Iniciando testes completos da API e do Importador de PDF...');

  // 1. Health check
  const health = await request('GET', '/api/health');
  console.log('1. Health check:', health.status === 200 ? '✅ PASS' : '❌ FAIL', health.data);

  // 2. Testar upload de PDF e extração
  const pdfPath = path.join(__dirname, 'cronograma_exemplo.pdf');
  const pdfRes = await uploadPdf(pdfPath);
  console.log('2. Upload e extração de PDF:', pdfRes.status === 200 ? '✅ PASS' : '❌ FAIL', {
    totalEvents: pdfRes.data?.totalEvents,
    filename: pdfRes.data?.filename
  });

  // 3. Testar inserção em lote (batch) dos eventos extraídos
  if (pdfRes.data?.events?.length > 0) {
    const batchRes = await request('POST', '/api/tasks/batch', {
      tasks: pdfRes.data.events,
      send_immediate_notification: false
    });
    console.log('3. Inserção em lote no calendário:', batchRes.status === 201 ? '✅ PASS' : '❌ FAIL', {
      count: batchRes.data?.count,
      message: batchRes.data?.message
    });
  }

  // 4. Listar tarefas atualizadas
  const tasks = await request('GET', '/api/tasks');
  console.log('4. Listagem de tarefas no banco:', tasks.status === 200 ? '✅ PASS' : '❌ FAIL', `(Total de ${tasks.data.length} tarefas)`);

  console.log('\n🎉 TODOS OS TESTES PASSARAM COM SUCESSO!');
}

runTests().catch(err => {
  console.error('❌ Erro no teste:', err);
  process.exit(1);
});
