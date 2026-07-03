const express = require('express');

const router = express.Router();

const {
  listarCategorias,
  criarCategoria,
  ativarCategoria,
  desativarCategoria
} = require('../controllers/categoriaServico.controller');

const authMiddleware = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');



// ✅ LISTAR CATEGORIAS
router.get(
  '/categorias-servico',
  authMiddleware,
  authorize('clinica'),
  listarCategorias
);

// ✅ CRIAR CATEGORIA
router.post(
  '/categorias-servico',
  authMiddleware,
  authorize('clinica'),
  criarCategoria
);

router.patch(
  '/categorias-servico/:id/ativar',
  authMiddleware,
  authorize('clinica'),
  ativarCategoria
)

router.patch(
  '/categorias-servico/:id/desativar',
  authMiddleware,
  authorize('clinica'),
  desativarCategoria
)



module.exports = router;