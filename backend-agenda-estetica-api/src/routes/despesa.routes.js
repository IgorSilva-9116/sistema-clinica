const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/auth.middleware');

// ✅ IMPORTA CORRETAMENTE O CONTROLLER DE DESPESA
const despesaController = require('../controllers/despesa.controller');

// ✅ CONTROLLER DE RELATÓRIO (mantido)
const {
  resumo,
  faturamentoPorServico,
  multas,
  relatorioClientes,
  resumoDespesas
} = require('../controllers/relatorios.controller');

// ✅ ROTAS EXISTENTES
router.get('/resumo', authMiddleware, resumo);
router.get('/faturamento-servico', authMiddleware, faturamentoPorServico);
router.get('/multas', authMiddleware, multas);
router.get('/clientes', authMiddleware, relatorioClientes);

// ✅ ✅ CORREÇÃO AQUI (ESSA É A LINHA QUE RESOLVE TUDO)
router.get('/despesas', authMiddleware, despesaController.listarDespesas);

module.exports = router;
