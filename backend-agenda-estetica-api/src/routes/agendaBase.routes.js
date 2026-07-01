const express = require('express');
const router = express.Router();

const agendaBaseController = require('../controllers/agendaBase.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

router.get(
  '/agenda/base',
  authMiddleware,
  authorize('clinica'),
  agendaBaseController.listarAgendaBase
);

router.put(
  '/agenda/base/:id',
  authMiddleware,
  authorize('clinica'),
  agendaBaseController.atualizarAgendaBase
);

router.patch(
  '/agenda/base/:id/ativar',
  authMiddleware,
  authorize('clinica'),
  agendaBaseController.ativarDia
);

router.patch(
  '/agenda/base/:id/desativar',
  authMiddleware,
  authorize('clinica'),
  agendaBaseController.desativarDia
);

module.exports = router;