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

// Middlewares CORS
const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];
app.use(cors({
  origin: (origin, callback) => {
    // Permite requisições sem origin (como mobile apps, curl, postman ou same-origin em produção)
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Em desenvolvimento ou em ambiente Serverless (Vercel/Netlify)
    if (process.env.NODE_ENV !== 'production' || process.env.VERCEL || process.env.NETLIFY) {
      return callback(null, true);
    }
    return callback(new Error('Origem não permitida pela política CORS.'));
  },
  credentials: true
}));

// Limite no tamanho do payload JSON para mitigar ataques DoS
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

// Montagem do router para suporte tanto local quanto Vercel (/api) e Netlify (/.netlify/functions/api e /api)
app.use('/api', apiRouter);
app.use('/.netlify/functions/api', apiRouter);

// Servir frontend compilado caso exista e não seja ambiente serverless puro
const distPath = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// Fallback SPA middleware
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/.netlify/functions/api')) {
    return res.status(404).json({ error: 'Endpoint não encontrado' });
  }
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  next();
});

module.exports = app;
