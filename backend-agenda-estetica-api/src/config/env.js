require('dotenv').config();

/**
 * =========================
 * VALIDAÇÃO DAS VARIÁVEIS DE AMBIENTE
 * =========================
 * Falha na inicialização se faltar algo crítico,
 * em vez de quebrar depois em produção.
 */
const obrigatorias = [
  'DB_SERVER',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'JWT_SECRET',
  'CORS_ORIGINS'
];

const faltando = obrigatorias.filter((nome) => !process.env[nome]);

if (faltando.length) {
  console.error(`❌ Variáveis de ambiente ausentes: ${faltando.join(', ')}`);
  process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
  console.error('❌ JWT_SECRET muito curto (mínimo 32 caracteres). Gere um com: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"');
  process.exit(1);
}

const isProd = process.env.NODE_ENV === 'production';

module.exports = {
  isProd,
  corsOrigins: process.env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
};
