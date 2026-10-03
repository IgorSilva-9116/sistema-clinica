const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

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
router.get('/resumo', authMiddleware, authorize('clinica'), resumo);
router.get('/faturamento-servico', authMiddleware, authorize('clinica'), faturamentoPorServico);
router.get('/multas', authMiddleware, authorize('clinica'), multas);
router.get('/clientes', authMiddleware, authorize('clinica'), relatorioClientes);

// ✅ ✅ CORREÇÃO AQUI (ESSA É A LINHA QUE RESOLVE TUDO)
router.get('/despesas', authMiddleware, authorize('clinica'), despesaController.listarDespesas);

router.post(
  '/despesas',
  authMiddleware, authorize('clinica'),
  despesaController.criarDespesa
)

router.put(
  '/despesas/:id',
  authMiddleware,
  despesaController.editarDespesa
)

router.delete(
  '/despesas/:id',
  authMiddleware,
  despesaController.excluirDespesa
)

router.patch(
  '/despesas/:id/pagar',
  authMiddleware,
  despesaController.marcarComoPago
)

router.get(
  '/despesas',
  authMiddleware,
  despesaController.listarDespesas
);

router.get(
  '/despesas/:id',
  authMiddleware, authorize('clinica'),
  despesaController.obterDespesaPorId
);


module.exports = router;
