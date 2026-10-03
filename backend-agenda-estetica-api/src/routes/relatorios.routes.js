const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');
const controller = require('../controllers/relatorios.controller');


// ✅ NÃO REPETE /api/v1 AQUI
router.get('/relatorios/resumo', auth, authorize('clinica'), controller.resumo);
router.get('/relatorios/faturamento-servico', auth, authorize('clinica'), controller.faturamentoPorServico);
router.get('/relatorios/clientes', auth, authorize('clinica'), controller.relatorioClientes);

router.get('/relatorios/despesas', auth, authorize('clinica'), controller.resumoDespesas);

router.get('/relatorios/meta', auth, authorize('clinica'), controller.obterMeta);
router.post('/relatorios/meta', auth, authorize('clinica'), controller.salvarMeta);

router.post('/relatorios/fechar-mes', auth, authorize('clinica'), controller.fecharMes);
router.delete('/relatorios/fechamentos/:id', auth, authorize('clinica'), controller.reabrirMes);
router.get('/relatorios/status-mes', auth, authorize('clinica'), controller.statusMes);
router.get('/relatorios/fechamentos', auth, authorize('clinica'), controller.listarFechamentos);
router.get('/relatorios/comparacao', auth, authorize('clinica'), controller.comparacaoPeriodo);
router.get('/relatorios/despesas-categoria', auth, authorize('clinica'), controller.despesasPorCategoria);

router.get('/relatorios/indicadores-clientes', auth, authorize('clinica'), controller.indicadoresClientes);
router.get('/relatorios/serie-faturamento', auth, authorize('clinica'), controller.serieFaturamento);



module.exports = router;