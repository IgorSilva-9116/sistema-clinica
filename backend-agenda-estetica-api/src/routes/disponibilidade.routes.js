const express = require('express');
const router = express.Router();

const controller = require('../controllers/disponibilidade.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get(
  '/agenda/disponibilidade',
  authMiddleware,
  controller.listarDisponibilidade
);

module.exports = router;
