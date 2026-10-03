const express = require('express');
const router = express.Router();

const controller = require('../controllers/agendamentoNovo.controller');
const { cancelarDia } = require('../controllers/cancelamentoDia.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

/**
 * =========================
 * AGENDAMENTOS
 * =========================
 */

// Criar agendamento
router.post(
  '/agendamentos',
  authMiddleware, authorize('clinica'),
  controller.criarAgendamento
);

// Listar agenda da clínica
router.get(
  '/agendamentos',
  authMiddleware, authorize('clinica'),
  controller.listarAgendaClinica
);

// Confirmar agendamento
router.patch(
  '/agendamentos/:id/confirmar',
  authMiddleware, authorize('clinica'),
  controller.confirmarAgendamento
);

// Cancelar agendamento
router.patch(
  '/agendamentos/:id/cancelar',
  authMiddleware, authorize('clinica'),
  controller.cancelarAgendamento
);

// Finalizar agendamentos (lote)
router.patch(
  '/agendamentos/finalizar',
  authMiddleware, authorize('clinica'),
  controller.finalizarAgendamentos
);


// Cancelar todos os atendimentos do dia (imprevisto da profissional)
router.post(
  '/agendamentos/cancelar-dia',
  authMiddleware, authorize('clinica'),
  cancelarDia
);

module.exports = router;
