const express = require('express');
const router = express.Router();

const profissionaisController = require('../controllers/profissionais.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

// Listar profissionais (clínica)
router.get(
  '/profissionais',
  authMiddleware,
  authorize('clinica'),
  profissionaisController.listarProfissionais
);

// Criar profissional (clínica)
router.post(
  '/profissionais',
  authMiddleware,
  authorize('clinica'),
  profissionaisController.criarProfissional
);

module.exports = router;