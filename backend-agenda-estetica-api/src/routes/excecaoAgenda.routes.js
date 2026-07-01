const express = require('express');
const router = express.Router();

const {
  listarExcecoesPorData,
  listarTodasExcecoes,
  listarDiasComExcecao,
  criarExcecao,
  removerExcecao,
  criarExcecaoPeriodo,
  alterarAtivaExcecao
  
} = require('../controllers/excecaoAgenda.controller');

const authMiddleware = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

/**
 * =========================
 * LISTAR EXCEÇÕES POR DATA
 * =========================
 * GET /api/v1/agenda/excecao?data=YYYY-MM-DD
 */
router.get(
  '/agenda/excecao',
  authMiddleware,
  authorize('clinica'),
  listarExcecoesPorData
);

/**
 * =========================
 * LISTAR EXCEÇÕES TODAS
 * =========================
 */
router.get(
  '/agenda/excecao/todas',
  authMiddleware,
  authorize('clinica'),
  listarTodasExcecoes
);

/**
 * =========================
 * LISTAR DIAS COM EXCEÇÃO
 * =========================
 */

router.get(
  '/agenda/excecao/dias',
  authMiddleware,
  authorize('clinica'),
  listarDiasComExcecao
);

/**
 * =========================
 * CRIAR EXCEÇÃO PONTUAL
 * =========================
 * POST /api/v1/agenda/excecao
 */
router.post(
  '/agenda/excecao',
  authMiddleware,
  authorize('clinica'),
  criarExcecao
);

/**
 * =========================
 * REMOVER EXCEÇÃO (PONTUAL OU PERÍODO)
 * =========================
 * DELETE /api/v1/agenda/excecao/:id
 */
router.delete(
  '/agenda/excecao/:id',
  authMiddleware,
  authorize('clinica'),
  removerExcecao
);

/**
 * =========================
 * CRIAR EXCEÇÃO POR PERÍODO
 * =========================
 * POST /api/v1/agenda/excecao-periodo
 */
router.post(
  '/agenda/excecao-periodo',
  authMiddleware,
  authorize('clinica'),
  criarExcecaoPeriodo
);


//  =========================
//  CRIAR EXCEÇÃO POR PERÍODO
//  =========================

router.patch(
  '/agenda/excecao/:id/ativa',
  authMiddleware,
  authorize('clinica'),
  alterarAtivaExcecao
);

module.exports = router;