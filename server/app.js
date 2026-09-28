require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// Desabilitar cabeçalho informativo de tecnologia
app.disable('x-powered-by');

// Cabeçalhos de Segurança HTTP (Hardening)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  next();
});

// Middleware CORS universal para ambientes de produção (Netlify/Vercel) e desenvolvimento
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Limite no tamanho do payload JSON
app.use(express.json({ limit: '5mb' }));

const { apiLimiter } = require('./middlewares/rateLimiter');

// Router da API unificado
const apiRouter = express.Router();
apiRouter.use(apiLimiter);

apiRouter.use('/tasks', require('./routes/tasks'));
apiRouter.use('/contacts', require('./routes/contacts'));
apiRouter.use('/birthdays', require('./routes/birthdays'));
apiRouter.use('/settings', require('./routes/settings'));
apiRouter.use('/notifications', require('./routes/notifications'));

// Health check
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'CALENDÁRIO OLINDINA API',
    runtime: process.env.NETLIFY ? 'netlify-functions' : (process.env.VERCEL ? 'vercel-serverless' : 'node-server')
  });
});

// Montagem do router para suportar todas as variações de URL:
// 1. /api/*
// 2. /.netlify/functions/api/*
// 3. /* (raiz direta)
app.use('/api', apiRouter);
app.use('/.netlify/functions/api', apiRouter);
app.use('/', apiRouter);

// Servir frontend compilado caso exista e seja ambiente local tradicional
const distPath = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(distPath) && !process.env.NETLIFY && !process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  app.use(express.static(distPath));
}

// Fallback SPA middleware
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/.netlify/functions/api')) {
    return res.status(404).json({ error: 'Endpoint da API não encontrado' });
  }
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath) && !process.env.NETLIFY && !process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return res.sendFile(indexPath);
  }
  return res.status(404).json({ error: 'Recurso não encontrado' });
});

// Middleware Global de Tratamento de Erros (Garante que nunca ocorra crash 502)
app.use((err, req, res, next) => {
  console.error('❌ [API Error]:', err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno no servidor',
    timestamp: new Date().toISOString()
  });
});

module.exports = app;
