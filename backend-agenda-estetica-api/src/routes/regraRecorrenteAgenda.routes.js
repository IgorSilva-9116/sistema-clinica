const express = require('express');
const router = express.Router();

const controller = require('../controllers/regraRecorrenteAgenda.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

router.get(
  '/agenda/regra-recorrente',
  authMiddleware,
  authorize('clinica'),
  controller.listarRegraAtiva
);

router.post(
  '/agenda/regra-recorrente',
  authMiddleware,
  authorize('clinica'),
  controller.criarRegra
);

router.patch(
  '/agenda/regra-recorrente/:id/desativar',
  authMiddleware,
  authorize('clinica'),
  controller.desativarRegra
);

module.exports = router;