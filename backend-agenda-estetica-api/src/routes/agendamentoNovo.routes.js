const express = require('express');
const router = express.Router();

const controller = require('../controllers/agendamentoNovo.controller');
const authMiddleware = require('../middlewares/auth.middleware');

/**
 * =========================
 * AGENDAMENTOS
 * =========================
 */

// Criar agendamento
router.post(
  '/agendamentos',
  authMiddleware,
  controller.criarAgendamento
);

// Listar agenda da clínica
router.get(
  '/agendamentos',
  authMiddleware,
  controller.listarAgendaClinica
);

// Confirmar agendamento
router.patch(
  '/agendamentos/:id/confirmar',
  authMiddleware,
  controller.confirmarAgendamento
);

// Cancelar agendamento
router.patch(
  '/agendamentos/:id/cancelar',
  authMiddleware,
  controller.cancelarAgendamento
);

// Finalizar agendamentos (lote)
router.patch(
  '/agendamentos/finalizar',
  authMiddleware,
  controller.finalizarAgendamentos
);

module.exports = router;