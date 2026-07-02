
// const { sql } = require('../config/database');




// /**
//  * ⚠️ LEGADO ⚠️
//  * Função mantida apenas para compatibilidade temporária.
//  * NÃO UTILIZAR para novos fluxos.
//  * O fluxo oficial está no motor novo (Passos 7 e 8).
//  */

// /**
//  * =========================
//  * LISTAR HORÁRIOS DISPONÍVEIS (CLIENTE)
//  * =========================
//  */
// async function listarHorariosDisponiveis(req, res) {
//     try {
//         const { data, servicoId } = req.query;

//         if (!data || !servicoId) {
//             return res.status(400).json({
//                 sucesso: false,
//                 mensagem: 'Data e serviço são obrigatórios',
//                 codigo: 'PARAMETROS_OBRIGATORIOS'
//             });
//         }

//         if (req.userTipo !== 'cliente') {
//             return res.status(403).json({
//                 sucesso: false,
//                 mensagem: 'Apenas clientes podem visualizar horários',
//                 codigo: 'ACESSO_NEGADO'
//             });
//         }

//         const result = await sql.connect().then(pool =>
//             pool.request()
//                 .input('ClinicaId', sql.Int, 1)
//                 .input('ServicoId', sql.Int, servicoId)
//                 .input('DataAgendamento', sql.Date, data)
//                 .execute('sp_ListarHorariosDisponiveis')
//         );

//         const horarios = result.recordset.map(h => ({
//             horario: h.Horario.toLocaleTimeString('pt-BR', {
//                 hour: '2-digit',
//                 minute: '2-digit'
//             })
//         }));

//         return res.status(200).json({
//             sucesso: true,
//             horarios
//         });

//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({
//             sucesso: false,
//             mensagem: 'Erro interno ao listar horários',
//             codigo: 'ERRO_INTERNO'
//         });
//     }
// }

// /**
//  * ⚠️ LEGADO ⚠️
//  * Função mantida apenas para compatibilidade temporária.
//  * NÃO UTILIZAR para novos fluxos.
//  * O fluxo oficial está no motor novo (Passos 7 e 8).
//  */

// /**
//  * =========================
//  * CRIAR AGENDAMENTO (CLIENTE)
//  * =========================
//  */
// async function criarAgendamento(req, res) {
//     try {
//         const { data, hora, servicoId } = req.body;

//         if (!data || !hora || !servicoId) {
//             return res.status(400).json({
//                 sucesso: false,
//                 mensagem: 'Dados incompletos para agendamento',
//                 codigo: 'PARAMETROS_OBRIGATORIOS'
//             });
//         }

//         if (req.userTipo !== 'cliente') {
//             return res.status(403).json({
//                 sucesso: false,
//                 mensagem: 'Apenas clientes podem criar agendamentos',
//                 codigo: 'ACESSO_NEGADO'
//             });
//         }

//         const horaDate = new Date(`1970-01-01T${hora}:00`);

//         await sql.connect().then(pool =>
//             pool.request()
//                 .input('ClinicaId', sql.Int, 1)
//                 .input('ClienteId', sql.Int, req.userId)
//                 .input('ServicoId', sql.Int, servicoId)
//                 .input('DataAgendamento', sql.Date, data)
//                 .input('HoraInicio', sql.Time, horaDate)
//                 .execute('sp_CriarAgendamento')
//         );

//         return res.status(201).json({
//             sucesso: true,
//             mensagem: 'Agendamento criado com sucesso'
//         });

//     } catch (error) {
//         console.error(error);

//         // Conflito de horário / regra de negócio
//         if (error.number === 50000) {
//             return res.status(409).json({
//                 sucesso: false,
//                 mensagem: error.message || 'Horário indisponível',
//                 codigo: 'CONFLITO_AGENDAMENTO'
//             });
//         }

//         return res.status(500).json({
//             sucesso: false,
//             mensagem: 'Erro interno ao criar agendamento',
//             codigo: 'ERRO_INTERNO'
//         });
//     }
// }


// /**
//  * ⚠️ LEGADO ⚠️
//  * Função mantida apenas para compatibilidade temporária.
//  * NÃO UTILIZAR para novos fluxos.
//  * O fluxo oficial está no motor novo (Passos 7 e 8).
//  */

// /**
//  * =========================
//  * CRIAR AGENDAMENTO (CLÍNICA / WEB)
//  * =========================
//  */
// async function criarAgendamentoClinica(req, res) {
//     try {
//         if (req.userTipo !== 'clinica') {
//             return res.status(403).json({
//                 sucesso: false,
//                 mensagem: 'Apenas clínicas podem criar agendamentos via Web',
//                 codigo: 'ACESSO_NEGADO'
//             });
//         }

//         const {
//             clienteId,
//             profissionalId,
//             servicoId,
//             dataAgendamento,
//             horaInicio
//         } = req.body;

//         if (!clienteId || !profissionalId || !servicoId || !dataAgendamento || !horaInicio) {
//             return res.status(400).json({
//                 sucesso: false,
//                 mensagem: 'Dados obrigatórios não informados',
//                 codigo: 'PARAMETROS_OBRIGATORIOS'
//             });
//         }

//         const clinicaId = req.userId;

//         // ✅ Validar vínculo cliente ↔ clínica
//         const vinculo = await sql.connect().then(pool =>
//             pool.request()
//                 .input('ClinicaId', sql.Int, clinicaId)
//                 .input('ClienteId', sql.Int, clienteId)
//                 .query(`
//                     SELECT 1
//                     FROM ClinicaCliente
//                     WHERE ClinicaId = @ClinicaId
//                       AND ClienteId = @ClienteId
//                       AND Status = 'Ativo'
//                 `)
//         );

//         if (vinculo.recordset.length === 0) {
//             return res.status(403).json({
//                 sucesso: false,
//                 mensagem: 'Cliente não pertence à clínica',
//                 codigo: 'VINCULO_INEXISTENTE'
//             });
//         }

//         const horaDate = new Date(`1970-01-01T${horaInicio}:00`);

//         // ✅ Criar agendamento reaproveitando a SP
//         await sql.connect().then(pool =>
//             pool.request()
//                 .input('ClinicaId', sql.Int, clinicaId)
//                 .input('ClienteId', sql.Int, clienteId)
//                 .input('ProfissionalId', sql.Int, profissionalId)
//                 .input('ServicoId', sql.Int, servicoId)
//                 .input('DataAgendamento', sql.Date, dataAgendamento)
//                 .input('HoraInicio', sql.Time, horaDate)
//                 .execute('sp_CriarAgendamento')
//         );

//         return res.status(201).json({
//             sucesso: true,
//             mensagem: 'Agendamento criado com sucesso'
//         });

//     } catch (error) {
//         console.error('Erro ao criar agendamento (clínica):', error);

//         if (error.number === 50000) {
//             return res.status(409).json({
//                 sucesso: false,
//                 mensagem: error.message || 'Horário indisponível',
//                 codigo: 'CONFLITO_AGENDAMENTO'
//             });
//         }

//         return res.status(500).json({
//             sucesso: false,
//             mensagem: 'Erro interno ao criar agendamento',
//             codigo: 'ERRO_INTERNO'
//         });
//     }
// }

// /**
//  * =========================
//  * CANCELAR AGENDAMENTO
//  * =========================
//  */
// async function cancelarAgendamento(req, res) {
//     try {
//         const { id } = req.params;

//         await sql.connect().then(pool =>
//             pool.request()
//                 .input('AgendamentoId', sql.Int, id)
//                 .execute('sp_CancelarAgendamento')
//         );

//         return res.status(200).json({
//             sucesso: true,
//             mensagem: 'Agendamento cancelado com sucesso'
//         });

//     } catch (error) {
//         console.error(error);

//         if (error.number === 50000) {
//             return res.status(409).json({
//                 sucesso: false,
//                 mensagem: error.message || 'Agendamento já está cancelado',
//                 codigo: 'CONFLITO_CANCELAMENTO'
//             });
//         }

//         return res.status(500).json({
//             sucesso: false,
//             mensagem: 'Erro interno ao cancelar agendamento',
//             codigo: 'ERRO_INTERNO'
//         });
//     }
// }

// /**
//  * =========================
//  * AGENDA DA CLÍNICA
//  * =========================
//  */
// async function listarAgendaClinica(req, res) {
//     try {
//         const { data } = req.query;

//         if (!data) {
//             return res.status(400).json({
//                 sucesso: false,
//                 mensagem: 'Data é obrigatória',
//                 codigo: 'PARAMETROS_OBRIGATORIOS'
//             });
//         }

//         if (req.userTipo !== 'clinica') {
//             return res.status(403).json({
//                 sucesso: false,
//                 mensagem: 'Apenas clínicas podem acessar a agenda',
//                 codigo: 'ACESSO_NEGADO'
//             });
//         }

//         const result = await sql.connect().then(pool =>
//             pool.request()
//                 .input('ClinicaId', sql.Int, req.userId)
//                 .input('DataAgendamento', sql.Date, data)
//                 .execute('sp_ListarAgendaClinica')
//         );

//         const agendamentos = result.recordset.map(a => ({
//             ...a,
//             HoraInicio: a.HoraInicio
//                 ? a.HoraInicio.toLocaleTimeString('pt-BR', {
//                     hour: '2-digit',
//                     minute: '2-digit'
//                 })
//                 : null
//         }));

//         return res.status(200).json({
//             sucesso: true,
//             agendamentos
//         });

//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({
//             sucesso: false,
//             mensagem: 'Erro interno ao listar agenda',
//             codigo: 'ERRO_INTERNO'
//         });
//     }
// }


// /**
//  * CONFIRMAR ATENDIMENTOS
//  * SOMENTE CLÍNICA
//  */

// async function confirmarAgendamento(req, res) {
//     try {
//         if (req.userTipo !== 'clinica') {
//             return res.status(403).json({
//                 sucesso: false,
//                 mensagem: 'Apenas clínicas podem confirmar atendimentos'
//             });
//         }

//         const agendamentoId = req.params.id;

//         await sql.connect().then(pool => {
//             return pool
//                 .request()
//                 .input('AgendamentoId', sql.Int, agendamentoId)
//                 .execute('sp_ConfirmarAgendamento');
//         });

//         return res.status(200).json({
//             sucesso: true,
//             mensagem: 'Atendimento confirmado'
//         });

//     } catch (error) {
//         console.error('Erro ao confirmar atendimento:', error);
//         return res.status(500).json({
//             sucesso: false,
//             mensagem: 'Erro ao confirmar atendimento'
//         });
//     }
// }


// /**
//  * ⚠️ LEGADO ⚠️
//  * Função mantida apenas para compatibilidade temporária.
//  * NÃO UTILIZAR para novos fluxos.
//  * O fluxo oficial está no motor novo (Passos 7 e 8).
//  */
// /**
//  * =========================
//  * LISTAR HORÁRIOS DISPONÍVEIS (CLÍNICA / POR PROFISSIONAL)
//  * =========================
//  */
// async function listarHorariosDisponiveisProfissional(req, res) {
//     try {
//         const { profissionalId, servicoId, data } = req.query;

//         if (!profissionalId || !servicoId || !data) {
//             return res.status(400).json({
//                 sucesso: false,
//                 mensagem: 'Profissional, serviço e data são obrigatórios',
//                 codigo: 'PARAMETROS_OBRIGATORIOS'
//             });
//         }

//         // ✅ Apenas clínica/admin pode usar essa rota
//         if (req.userTipo !== 'clinica') {
//             return res.status(403).json({
//                 sucesso: false,
//                 mensagem: 'Apenas clínicas podem visualizar horários por profissional',
//                 codigo: 'ACESSO_NEGADO'
//             });
//         }

//         const result = await sql.connect().then(pool =>
//             pool.request()
//                 // 🔐 clínica vem do token
//                 .input('ClinicaId', sql.Int, req.userId)
//                 .input('ProfissionalId', sql.Int, profissionalId)
//                 .input('ServicoId', sql.Int, servicoId)
//                 .input('DataAgendamento', sql.Date, data)
//                 .execute('sp_ListarHorariosDisponiveisProfissional')
//         );

//         // ✅ Retornar no formato simples que o frontend espera
//         const horarios = result.recordset.map(h =>
//             h.Horario.toLocaleTimeString('pt-BR', {
//                 hour: '2-digit',
//                 minute: '2-digit'
//             })
//         );

//         return res.status(200).json(horarios);

//     } catch (error) {
//         console.error('Erro ao listar horários por profissional:', error);
//         return res.status(500).json({
//             sucesso: false,
//             mensagem: 'Erro interno ao listar horários',
//             codigo: 'ERRO_INTERNO'
//         });
//     }
// }

// /**
//  * INICIAR ATENDIMENTOS
//  * SOMENTE CLÍNICA
//  */

// async function iniciarAtendimento(req, res) {
//     try {
//         if (req.userTipo !== 'clinica') {
//             return res.status(403).json({
//                 sucesso: false,
//                 mensagem: 'Apenas clínicas podem iniciar atendimento'
//             });
//         }

//         const agendamentoId = req.params.id;

//         await sql.connect().then(pool => {
//             return pool
//                 .request()
//                 .input('AgendamentoId', sql.Int, agendamentoId)
//                 .execute('sp_IniciarAtendimento');
//         });

//         return res.status(200).json({
//             sucesso: true,
//             mensagem: 'Atendimento iniciado'
//         });

//     } catch (error) {
//         console.error('Erro ao iniciar atendimento:', error);
//         return res.status(500).json({
//             sucesso: false,
//             mensagem: 'Erro ao iniciar atendimento'
//         });
//     }
// }

// /**
//  * FINALIZAR ATENDIMENTOS
//  * SOMENTE CLÍNICA
//  */

// async function finalizarAtendimento(req, res) {
//     try {
//         if (req.userTipo !== 'clinica') {
//             return res.status(403).json({
//                 sucesso: false,
//                 mensagem: 'Apenas clínicas podem finalizar atendimento'
//             });
//         }

//         const agendamentoId = req.params.id;

//         await sql.connect().then(pool => {
//             return pool
//                 .request()
//                 .input('AgendamentoId', sql.Int, agendamentoId)
//                 .execute('sp_FinalizarAtendimento');
//         });

//         return res.status(200).json({
//             sucesso: true,
//             mensagem: 'Atendimento finalizado'
//         });

//     } catch (error) {
//         console.error('Erro ao finalizar atendimento:', error);
//         return res.status(500).json({
//             sucesso: false,
//             mensagem: 'Erro ao finalizar atendimento'
//         });
//     }
// }

// module.exports = {
//     listarHorariosDisponiveis,
//     listarHorariosDisponiveisProfissional,
//     criarAgendamento,
//     criarAgendamentoClinica, 
//     cancelarAgendamento,
//     listarAgendaClinica,
//     confirmarAgendamento,
//     iniciarAtendimento,
//     finalizarAtendimento
// };
