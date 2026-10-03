const express = require('express');
const router = express.Router();

const usuarioController = require('../controllers/usuarios.controller');

const authMiddleware = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

/**
 * =================================================
 * USUÁRIOS CLIENTE / PROFISSIONAL
 * =================================================
 */

// Criar usuário para cliente
router.post(
  '/usuarios/cliente',
  authMiddleware,
  authorize('clinica'),
  usuarioController.criarUsuarioCliente
);

// Criar usuário para profissional
router.post(
  '/usuarios/profissional',
  authMiddleware,
  authorize('clinica'),
  usuarioController.criarUsuarioProfissional
);

/**
 * =================================================
 * USUÁRIOS ADMINISTRATIVOS DA CLÍNICA (MASTER)
 * =================================================
 */

// Listar usuários administrativos
router.get(
  '/usuarios',
  authMiddleware,
  authorize('MASTER'),
  usuarioController.listarUsuarios
);

// Criar usuário administrativo
router.post(
  '/usuarios/clinica',
  authMiddleware,
  authorize('MASTER'),
  usuarioController.criarUsuarioClinica
);

// Editar usuário administrativo
router.put(
  '/usuarios/:id',
  authMiddleware,
  authorize('MASTER'),
  usuarioController.editarUsuario
);

// Ativar / desativar usuário
router.patch(
  '/usuarios/:id/status',
  authMiddleware,
  authorize('MASTER'),
  usuarioController.alterarStatusUsuario
);

// Redefinir senha
router.patch(
  '/usuarios/:id/senha',
  authMiddleware, authorize('clinica'),
  usuarioController.redefinirSenha
);

router.delete(
  '/usuarios/:id',
  authMiddleware,
  authorize('MASTER'),
  usuarioController.excluirUsuario // ✅ CORRETO
);


module.exports = router;