const express = require('express')
const router = express.Router()

const authMiddleware = require('../middlewares/auth.middleware')
const authorize = require('../middlewares/role.middleware')

const controller = require('../controllers/listaEspera.controller')

// entrar na lista
router.post(
  '/lista-espera',
  authMiddleware,
  authorize('clinica'),
  controller.entrarListaEspera
)

// listar
router.get(
  '/lista-espera',
  authMiddleware,
  authorize('clinica'),
  controller.listarLista
)

// remover
router.put(
  '/lista-espera/:id',
  authMiddleware,
  authorize('clinica'),
  controller.removerLista
)

module.exports = router