const express = require('express');
const router = express.Router();

const controller = require('../controllers/publico.controller');

/**
 * =========================
 * ROTAS PÚBLICAS (sem login)
 * =========================
 */

// Página da clínica: nome, contato e serviços ativos
router.get('/publico/clinicas/:slug', controller.obterClinicaPublica);

// Cliente cria a própria conta pelo link da clínica
router.post('/publico/clinicas/:slug/cadastro', controller.cadastrarCliente);

// Convite enviado pela clínica (WhatsApp)
router.get('/publico/convites/:token', controller.obterConvite);
router.post('/publico/convites/ativar', controller.ativarConvite);

module.exports = router;
