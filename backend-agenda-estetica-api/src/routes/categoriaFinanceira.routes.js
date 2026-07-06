const express = require('express')

const router = express.Router()

const {
  listarCategorias,
  criarCategoria,
  ativarCategoria,
  desativarCategoria
} = require('../controllers/categoriaFinanceira.controller')

const authMiddleware =
  require('../middlewares/auth.middleware')

const authorize =
  require('../middlewares/role.middleware')

router.get(
  '/categorias-financeiras',
  authMiddleware,
  authorize('clinica'),
  listarCategorias
)

router.post(
  '/categorias-financeiras',
  authMiddleware,
  authorize('clinica'),
  criarCategoria
)

router.patch(
  '/categorias-financeiras/:id/ativar',
  authMiddleware,
  authorize('clinica'),
  ativarCategoria
)

router.patch(
  '/categorias-financeiras/:id/desativar',
  authMiddleware,
  authorize('clinica'),
  desativarCategoria
)

module.exports = router