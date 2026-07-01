const rateLimit = require('express-rate-limit');

const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos

  // ✅ limite dinâmico por método
  max: (req, res) => {
    if (req.method === 'OPTIONS') return 0;   // nunca limitar preflight
    if (req.method === 'GET') return 500;     // leitura liberada
    return 100;                               // escrita protegida
  },

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    sucesso: false,
    mensagem: 'Muitas requisições. Aguarde alguns minutos.',
    codigo: 'RATE_LIMIT'
  }
});

module.exports = rateLimiter;