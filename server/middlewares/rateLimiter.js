/**
 * Middleware de Rate Limiting nativo e leve em memória com proteção para ambientes Serverless
 */

function createRateLimiter({
  windowMs = 60 * 1000, // 1 minuto
  max = 120,            // máx requisições por janela
  message = 'Muitas requisições enviadas. Por favor, aguarde alguns instantes antes de tentar novamente.'
} = {}) {
  const requests = new Map();

  // Limpeza periódica de IPs inativos (apenas em servidor tradicional com processo persistente)
  if (!process.env.NETLIFY && !process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [ip, record] of requests.entries()) {
        if (now - record.startTime > windowMs * 2) {
          requests.delete(ip);
        }
      }
    }, 5 * 60 * 1000);
    if (cleanupTimer && cleanupTimer.unref) {
      cleanupTimer.unref();
    }
  }

  return (req, res, next) => {
    try {
      const rawForwarded = req.headers ? (req.headers['x-forwarded-for'] || req.headers['client-ip']) : null;
      const ip = (rawForwarded ? String(rawForwarded).split(',')[0].trim() : null) ||
                 req.ip ||
                 (req.socket && req.socket.remoteAddress) ||
                 'global-client';

      const now = Date.now();
      let record = requests.get(ip);

      if (!record || now - record.startTime > windowMs) {
        record = {
          startTime: now,
          count: 1
        };
        requests.set(ip, record);
        return next();
      }

      record.count++;

      if (record.count > max) {
        const retryAfterSeconds = Math.ceil((record.startTime + windowMs - now) / 1000);
        res.setHeader('Retry-After', retryAfterSeconds);
        return res.status(429).json({
          error: message,
          retryAfter: retryAfterSeconds
        });
      }

      next();
    } catch (e) {
      // Fallback gracioso para garantir que o rate limiter nunca interrompa o fluxo com erro 500/502
      next();
    }
  };
}

module.exports = {
  createRateLimiter,
  apiLimiter: createRateLimiter({ windowMs: 60 * 1000, max: 200, message: 'Limite de requisições excedido. Aguarde um minuto.' }),
  emailLimiter: createRateLimiter({ windowMs: 60 * 1000, max: 20, message: 'Muitos envios de e-mail solicitados. Aguarde um momento para tentar novamente.' }),
  mutationLimiter: createRateLimiter({ windowMs: 60 * 1000, max: 80, message: 'Muitas operações de modificação. Aguarde alguns instantes.' })
};
