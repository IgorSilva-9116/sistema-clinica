// const express = require('express');
// const router = express.Router();

// const agendaController = require('../controllers/agenda.controller');
// const authMiddleware = require('../middlewares/auth.middleware');
// const authorize = require('../middlewares/role.middleware');

// /**
//  * =========================
//  * CLIENTE FINAL (APP)
//  * =========================
//  */

// // Cliente pode listar horários
// router.get(
//   '/agenda/horarios-disponiveis',
//   authMiddleware,
//   authorize('cliente'),
//   agendaController.listarHorariosDisponiveis
// );

// // Cliente cria agendamento (APP)
// router.post(
//   '/agenda/agendar',
//   authMiddleware,
//   authorize('cliente'),
//   agendaController.criarAgendamento
// );

// /**
//  * =========================
//  * CLÍNICA / ADMIN (WEB)
//  * =========================
//  */

// // ✅ Criar agendamento pela clínica (WEB)
// router.post(
//   '/agendamentos/clinica',
//   authMiddleware,
//   authorize('clinica'),
//   agendaController.criarAgendamentoClinica
// );

// // Horários por profissional (clínica)
// router.get(
//   '/agenda/horarios-disponiveis-profissional',
//   authMiddleware,
//   authorize('clinica'),
//   agendaController.listarHorariosDisponiveisProfissional
// );

// // Clínica confirma atendimento
// router.put(
//   '/agenda/confirmar/:id',
//   authMiddleware,
//   authorize('clinica'),
//   agendaController.confirmarAgendamento
// );

// // Clínica inicia atendimento
// router.put(
//   '/agenda/iniciar/:id',
//   authMiddleware,
//   authorize('clinica'),
//   agendaController.iniciarAtendimento
// );

// // Clínica finaliza atendimento
// router.put(
//   '/agenda/finalizar/:id',
//   authMiddleware,
//   authorize('clinica'),
//   agendaController.finalizarAtendimento
// );

// // Clínica visualiza agenda
// router.get(
//   '/agenda/clinica',
//   authMiddleware,
//   authorize('clinica'),
//   agendaController.listarAgendaClinica
// );

// module.exports = router;
