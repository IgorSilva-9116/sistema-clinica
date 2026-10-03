const express = require('express');
const router = express.Router();

const clientesController = require('../controllers/clientes.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');
const upload = require('../config/upload');

// ✅ Listar clientes (somente clínica)
router.get(
  '/clientes',
  authMiddleware,
  authorize('clinica'),
  clientesController.listarClientes
);

// ✅ Criar cliente
router.post(
  '/clientes',
  authMiddleware,
  authorize('clinica'),
  upload.single('foto'), // ✅ ISSO AQUI É O SEGREDO
  clientesController.criarCliente
);

// ✅ LISTAR CLIENTE ANIVERSARIANTE
router.get(
  '/clientes/aniversariantes',
  authMiddleware,
  authorize('clinica'),
  clientesController.listarAniversariantes
);

// ✅ Buscar cliente por ID (edição)
router.get(
  '/clientes/:id',
  authMiddleware,
  authorize('clinica'),
  clientesController.buscarPorId
);

// ✅ ATUALIZAR CLIENTE (ESTAVA FALTANDO)
router.put(
  '/clientes/:id',
  authMiddleware,
  authorize('clinica'),
  upload.single('foto'),
  clientesController.atualizarCliente
);

// ✅ Gerar link de acesso ao app para a cliente (enviado pelo WhatsApp)
router.post(
  '/clientes/:id/convite',
  authMiddleware,
  authorize('clinica'),
  clientesController.gerarConvite
);

module.exports = router;
