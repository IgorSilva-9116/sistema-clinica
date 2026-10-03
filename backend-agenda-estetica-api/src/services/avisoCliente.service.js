const { sql } = require('../config/database');

/**
 * Avisos para a cliente (confirmação, cancelamento...).
 * Hoje: ficam registrados e aparecem no app.
 * Fase 4: o mesmo registro será enviado por e-mail e WhatsApp
 * (colunas EmailEnviadoEm / WhatsAppEnviadoEm da tabela Notificacao).
 */

/**
 * Descreve o atendimento ao qual o agendamento pertence
 * (todos os serviços do mesmo grupo), para usar no texto do aviso.
 */
async function descreverAtendimento(pool, agendamentoId) {
  const result = await pool.request()
    .input('Id', sql.Int, agendamentoId)
    .query(`
      SELECT
        a.ClinicaId,
        a.ClienteId,
        a.DataAgendamento,
        CONVERT(VARCHAR(5), a.HoraInicio, 108) AS HoraInicio,
        s.Titulo
      FROM Agendamento a
      JOIN Servico s ON s.Id = a.ServicoId
      JOIN Agendamento ref ON ref.Id = @Id
      WHERE a.Id = @Id
         OR (ref.GrupoAgendamento IS NOT NULL AND a.GrupoAgendamento = ref.GrupoAgendamento)
      ORDER BY a.HoraInicio
    `);

  const itens = result.recordset;
  if (itens.length === 0) return null;

  const data = new Date(itens[0].DataAgendamento);
  const dataTexto = data.toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: '2-digit', timeZone: 'UTC'
  });

  return {
    clinicaId: itens[0].ClinicaId,
    clienteId: itens[0].ClienteId,
    texto: `${dataTexto} às ${itens[0].HoraInicio} (${itens.map(i => i.Titulo).join(' + ')})`
  };
}

/**
 * Registra um aviso para a cliente do agendamento.
 * Nunca derruba a operação principal: se falhar, só registra no log.
 */
async function avisarCliente(pool, { agendamentoId, tipo, titulo, mensagem }) {
  try {
    const atendimento = await descreverAtendimento(pool, agendamentoId);
    if (!atendimento) return;

    await pool.request()
      .input('ClinicaId', sql.Int, atendimento.clinicaId)
      .input('ClienteId', sql.Int, atendimento.clienteId)
      .input('AgendamentoId', sql.Int, agendamentoId)
      .input('Tipo', sql.VarChar(40), tipo)
      .input('Titulo', sql.NVarChar(150), titulo)
      .input('Mensagem', sql.NVarChar(1000), mensagem(atendimento.texto))
      .query(`
        INSERT INTO Notificacao (ClinicaId, ClienteId, AgendamentoId, Tipo, Titulo, Mensagem)
        VALUES (@ClinicaId, @ClienteId, @AgendamentoId, @Tipo, @Titulo, @Mensagem)
      `);
  } catch (error) {
    console.warn('Não foi possível registrar o aviso da cliente:', error.message);
  }
}

module.exports = { avisarCliente };
