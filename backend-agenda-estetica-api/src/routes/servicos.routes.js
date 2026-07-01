const express = require('express');
const router = express.Router();

const servicosController = require('../controllers/servicos.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

/**
 * =========================
 * LISTAGEM DE SERVIÇOS
 * =========================
 */

// Listar serviços ATIVOS
// Acessível por:
// - clínica
// - profissional
// - cliente
router.get(
  '/servicos',
  authMiddleware,
  authorize('clinica', 'profissional', 'cliente'),
  servicosController.listarServicos
);

// Listar TODOS os serviços (ativos + inativos)
// Somente clínica (admin)
router.get(
  '/servicos/admin',
  authMiddleware,
  authorize('clinica'),
  servicosController.listarServicosAdmin
);

/**
 * =========================
 * GESTÃO DE SERVIÇOS
 * =========================
 * Somente clínica
 */

// Criar serviço
router.post(
  '/servicos',
  authMiddleware,
  authorize('clinica'),
  servicosController.criarServico
);

// Atualizar serviço (editar dados)
router.put(
  '/servicos/:id',
  authMiddleware,
  authorize('clinica'),
  servicosController.atualizarServico
);

// Desativar serviço
router.patch(
  '/servicos/:id/desativar',
  authMiddleware,
  authorize('clinica'),
  servicosController.desativarServico
);

// Ativar serviço
router.patch(
  '/servicos/:id/ativar',
  authMiddleware,
  authorize('clinica'),
  servicosController.ativarServico
);

module.exports = router;
