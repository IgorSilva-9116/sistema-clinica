const express = require('express');
const router = express.Router();

const controller = require('../controllers/clientePortal.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

/**
 * =========================
 * ÁREA DA CLIENTE (somente usuário tipo cliente)
 * =========================
 */
router.get('/cliente/perfil', authMiddleware, authorize('cliente'), controller.obterPerfil);
router.put('/cliente/perfil', authMiddleware, authorize('cliente'), controller.atualizarPerfil);
router.put('/cliente/senha', authMiddleware, authorize('cliente'), controller.alterarSenha);

module.exports = router;
