const express = require('express');
const router = express.Router();

const {
  obterConfiguracoes,
  atualizarConfiguracoes,
  obterPolitica,
  atualizarPolitica
} = require('../controllers/clinicaConfiguracoes.controller');

const authMiddleware = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

// =============================
// CONFIGURAÇÕES
// =============================
router.get(
  '/clinica/configuracoes',
  authMiddleware,
  obterConfiguracoes
);

router.put(
  '/clinica/configuracoes',
  authMiddleware,
  atualizarConfiguracoes
);

// =============================
// POLÍTICA
// =============================
router.get(
  '/clinica/politica',
  authMiddleware,
  obterPolitica
);

router.put(
  '/clinica/politica',
  authMiddleware,
  authorize('clinica'),
  atualizarPolitica
);

module.exports = router;