const express = require('express');
const router = express.Router();

const controller = require('../controllers/disponibilidade.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

router.get(
  '/agenda/disponibilidade',
  authMiddleware, authorize('clinica', 'cliente'),
  controller.listarDisponibilidade
);

module.exports = router;
