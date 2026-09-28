const app = require('./app');
const { startScheduler } = require('./services/scheduler');

const PORT = process.env.PORT || 3001;

// Iniciar agendador de lembretes automáticos no servidor Node.js
startScheduler();

// Iniciar servidor HTTP
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend rodando na porta ${PORT}: http://localhost:${PORT}`);
});
