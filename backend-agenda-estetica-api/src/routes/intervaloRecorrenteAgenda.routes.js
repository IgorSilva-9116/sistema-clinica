const express = require('express');
const router = express.Router();

const controller = require('../controllers/intervaloRecorrenteAgenda.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

/**
 * =========================
 * LISTAR INTERVALOS
 * =========================
 */
router.get(
  '/agenda/intervalo-recorrente',
  authMiddleware,
  authorize('clinica'),
  controller.listarIntervalos
);

/**
 * =========================
 * CRIAR INTERVALO
 * =========================
 */
router.post(
  '/agenda/intervalo-recorrente',
  authMiddleware,
  authorize('clinica'),
  controller.criarIntervalo
);

router.put(
  '/agenda/intervalo-recorrente/:id',
  authMiddleware,
  authorize('clinica'),
  controller.atualizarIntervalo
);

router.patch(
  '/agenda/intervalo-recorrente/:id/ativar',
  authMiddleware,
  authorize('clinica'),
  controller.ativarIntervalo
);

router.patch(
  '/agenda/intervalo-recorrente/:id/desativar',
  authMiddleware,
  authorize('clinica'),
  controller.desativarIntervalo
);

router.delete(
  '/agenda/intervalo-recorrente/:id',
  authMiddleware,
  authorize('clinica'),
  controller.excluirIntervalo
);

module.exports = router;