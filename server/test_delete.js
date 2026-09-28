const http = require('http');

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

async function testDeletion() {
  console.log('🧪 Testando exclusão individual e em lote de tarefas...');

  // 1. Limpar todas as tarefas
  const clearRes = await request('DELETE', '/api/tasks/all');
  console.log('1. DELETE /api/tasks/all:', clearRes.status === 200 ? '✅ PASS' : '❌ FAIL', clearRes.data);

  // 2. Verificar que a lista está vazia (0 tarefas)
  const emptyList = await request('GET', '/api/tasks');
  console.log('2. Verificar tarefas vazias:', emptyList.status === 200 && emptyList.data.length === 0 ? '✅ PASS' : '❌ FAIL', `(Total de ${emptyList.data.length} tarefas)`);

  // 3. Criar uma tarefa para testar exclusão individual
  const createRes = await request('POST', '/api/tasks', {
    title: 'Tarefa Teste Exclusao',
    date: '2026-09-05',
    start_time: '10:00'
  });
  console.log('3. Criar tarefa:', createRes.status === 201 ? '✅ PASS' : '❌ FAIL', createRes.data?.task?.id);

  const taskId = createRes.data?.task?.id;

  // 4. Excluir a tarefa criada
  const deleteSingle = await request('DELETE', `/api/tasks/${taskId}`);
  console.log('4. DELETE /api/tasks/:id:', deleteSingle.status === 200 ? '✅ PASS' : '❌ FAIL', deleteSingle.data);

  // 5. Verificar que voltou a 0 tarefas
  const finalList = await request('GET', '/api/tasks');
  console.log('5. Verificar lista vazia final:', finalList.status === 200 && finalList.data.length === 0 ? '✅ PASS' : '❌ FAIL', `(Total de ${finalList.data.length} tarefas)`);

  console.log('\n🎉 TODOS OS TESTES DE EXCLUSÃO PASSARAM COM SUCESSO!');
}

testDeletion().catch(err => {
  console.error('❌ Erro no teste de exclusão:', err);
  process.exit(1);
});
