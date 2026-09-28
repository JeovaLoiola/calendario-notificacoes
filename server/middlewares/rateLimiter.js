/**
 * Middleware de Rate Limiting nativo e leve em memória
 * Protege contra DoS, ataques de força bruta e esgotamento de cotas de e-mail.
 */

function createRateLimiter({
  windowMs = 60 * 1000, // 1 minuto
  max = 30,             // máx requisições por janela
  message = 'Muitas requisições enviadas. Por favor, aguarde alguns instantes antes de tentar novamente.'
} = {}) {
  const requests = new Map();

  // Limpeza periódica de IPs inativos a cada 5 minutos
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

  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown-ip';
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
  };
}

module.exports = {
  createRateLimiter,
  apiLimiter: createRateLimiter({ windowMs: 60 * 1000, max: 120, message: 'Limite de requisições excedido. Aguarde um minuto.' }),
  emailLimiter: createRateLimiter({ windowMs: 60 * 1000, max: 10, message: 'Muitos envios de e-mail solicitados. Aguarde um momento para tentar novamente.' }),
  mutationLimiter: createRateLimiter({ windowMs: 60 * 1000, max: 40, message: 'Muitas operações de modificação. Aguarde alguns instantes.' })
};
