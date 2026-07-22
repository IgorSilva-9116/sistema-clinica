require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path'); // ✅ NOVO

const app = express();
app.disable('etag');

/**
 * =========================
 * CORS
 * =========================
 */
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

/**
 * =========================
 * MIDDLEWARES GLOBAIS
 * =========================
 */

// JSON
app.use(express.json());

// ✅ SERVIR ARQUIVOS (IMAGENS DE CLIENTES)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Segurança HTTP
app.use(helmet());

// Remove fingerprint
app.disable('x-powered-by');

// Rate limit
const rateLimiter = require('./middlewares/rate-limit.middleware');
app.use(rateLimiter);

// Logs
const logMiddleware = require('./middlewares/log.middleware');
app.use(logMiddleware);

/**
 * =========================
 * ROTAS
 * =========================
 */
const authRoutes = require('./routes/auth.routes');
const relatoriosRoutes = require('./routes/relatorios.routes');
const clientesRoutes = require('./routes/clientes.routes');
const servicosRoutes = require('./routes/servicos.routes');
const profissionaisRoutes = require('./routes/profissionais.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const agendaBaseRoutes = require('./routes/agendaBase.routes');
const regraRecorrenteAgendaRoutes = require('./routes/regraRecorrenteAgenda.routes');
const excecaoAgendaRoutes = require('./routes/excecaoAgenda.routes');
const disponibilidadeRoutes = require('./routes/disponibilidade.routes');
const agendamentoNovoRoutes = require('./routes/agendamentoNovo.routes');
const clinicaConfiguracoesRoutes = require('./routes/clinicaConfiguracoes.routes');
const senhaRoutes = require('./routes/senha.routes');
const listaEsperaRoutes = require('./routes/listaEspera.routes');
const despesaRoutes = require('./routes/despesa.routes');
const categoriaServicoRoutes = require('./routes/categoriaServico.routes');
const categoriaFinanceiraRoutes = require('./routes/categoriaFinanceira.routes');
const intervaloregraRecorrenteAgendaRoutes = require('./routes/intervaloRecorrenteAgenda.routes');


/**
 * =========================
 * VERSIONAMENTO DA API
 * =========================
 */
app.use('/api/v1', authRoutes);
app.use('/api/v1', relatoriosRoutes);
app.use('/api/v1', clientesRoutes);
app.use('/api/v1', servicosRoutes);
app.use('/api/v1',categoriaServicoRoutes);
app.use('/api/v1', profissionaisRoutes);
app.use('/api/v1', usuariosRoutes);
app.use('/api/v1', agendaBaseRoutes);
app.use('/api/v1', regraRecorrenteAgendaRoutes);
app.use('/api/v1', excecaoAgendaRoutes);
app.use('/api/v1', disponibilidadeRoutes);
app.use('/api/v1', agendamentoNovoRoutes);
app.use('/api/v1', clinicaConfiguracoesRoutes);
app.use('/api/v1', senhaRoutes);
app.use('/api/v1', listaEsperaRoutes);
app.use('/api/v1', despesaRoutes);
app.use('/api/v1', categoriaFinanceiraRoutes);
app.use('/api/v1', intervaloregraRecorrenteAgendaRoutes);


/**
 * =========================
 * HEALTH CHECK
 * =========================
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'API funcionando',
    timestamp: new Date()
  });
});

module.exports = app;