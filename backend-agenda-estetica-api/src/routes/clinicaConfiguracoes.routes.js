const express = require('express');
const router = express.Router();

const {
  obterConfiguracoes,
  atualizarConfiguracoes,
  obterPolitica,
  atualizarPolitica,
  obterLinkPublico
} = require('../controllers/clinicaConfiguracoes.controller');

const authMiddleware = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

// =============================
// CONFIGURAÇÕES
// =============================
router.get(
  '/clinica/configuracoes',
  authMiddleware, authorize('clinica'),
  obterConfiguracoes
);

router.put(
  '/clinica/configuracoes',
  authMiddleware, authorize('clinica'),
  atualizarConfiguracoes
);

// =============================
// POLÍTICA
// =============================
router.get(
  '/clinica/politica',
  authMiddleware, authorize('clinica'),
  obterPolitica
);

router.put(
  '/clinica/politica',
  authMiddleware,
  authorize('clinica'),
  atualizarPolitica
);


router.get(
  '/clinica/link-publico',
  authMiddleware,
  authorize('clinica'),
  obterLinkPublico
);

module.exports = router;
