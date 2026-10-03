const express = require('express');
const router = express.Router();

const controller = require('../controllers/clientePortal.controller');
const agenda = require('../controllers/clienteAgenda.controller');
const atendimentos = require('../controllers/clienteAtendimentos.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

/**
 * =========================
 * ÁREA DA CLIENTE (somente usuário tipo cliente)
 * =========================
 */
router.get('/cliente/perfil', authMiddleware, authorize('cliente'), controller.obterPerfil);
router.put('/cliente/perfil', authMiddleware, authorize('cliente'), controller.atualizarPerfil);
router.put('/cliente/senha', authMiddleware, authorize('cliente'), controller.alterarSenha);

// Agendamento online
router.get('/cliente/agenda/configuracao', authMiddleware, authorize('cliente'), agenda.obterConfiguracao);
router.get('/cliente/agenda/dias', authMiddleware, authorize('cliente'), agenda.listarDias);
router.get('/cliente/agenda/horarios', authMiddleware, authorize('cliente'), agenda.listarHorarios);
router.post('/cliente/agendamentos', authMiddleware, authorize('cliente'), agenda.criarAgendamento);

// Meus agendamentos
router.get('/cliente/agendamentos', authMiddleware, authorize('cliente'), atendimentos.listarAtendimentos);
router.post('/cliente/agendamentos/:id/cancelar', authMiddleware, authorize('cliente'), atendimentos.cancelarAtendimento);
router.post('/cliente/agendamentos/:id/remarcar', authMiddleware, authorize('cliente'), atendimentos.remarcarAtendimento);

// Avisos no app
router.get('/cliente/notificacoes', authMiddleware, authorize('cliente'), atendimentos.listarNotificacoes);
router.post('/cliente/notificacoes/lidas', authMiddleware, authorize('cliente'), atendimentos.marcarNotificacoesLidas);

module.exports = router;
