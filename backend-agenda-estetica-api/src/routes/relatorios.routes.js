const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth.middleware');
const controller = require('../controllers/relatorios.controller');


// ✅ NÃO REPETE /api/v1 AQUI
router.get('/relatorios/resumo', auth, controller.resumo);
router.get('/relatorios/faturamento-servico', auth, controller.faturamentoPorServico);
router.get('/relatorios/clientes', auth, controller.relatorioClientes);

router.get('/relatorios/despesas', auth, controller.resumoDespesas);

router.get('/relatorios/meta', auth, controller.obterMeta);
router.post('/relatorios/meta', auth, controller.salvarMeta);

router.post('/relatorios/fechar-mes', auth, controller.fecharMes);
router.get('/relatorios/status-mes', auth, controller.statusMes);
router.get('/relatorios/comparacao', auth, controller.comparacaoPeriodo);
router.get('/relatorios/despesas-categoria', auth, controller.despesasPorCategoria);


module.exports = router;