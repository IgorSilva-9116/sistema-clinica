const express = require('express');
const router = express.Router();

const senhaController = require('../controllers/senha.controller');

router.post('/auth/esqueceu-senha', senhaController.esqueceuSenha);
router.post('/auth/resetar-senha', senhaController.resetarSenha);

module.exports = router;