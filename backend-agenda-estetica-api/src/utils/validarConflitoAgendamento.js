const { sql } = require('../config/database');

/**
 * Verifica se existe conflito de agendamento
 *
 * Quando recebe o "request" de uma transação, a consulta roda dentro
 * dela com UPDLOCK/HOLDLOCK: duas pessoas agendando o mesmo horário
 * ao mesmo tempo não passam juntas (a segunda espera e vê o conflito).
 * ignorarIds: agendamentos que não contam (a própria remarcação).
 */
async function existeConflitoAgendamento(
  clinicaId,
  data,
  horaInicio,
  horaFim,
  request,
  ignorarIds = []
) {
  const req = request || (await sql.connect()).request();

  ignorarIds.forEach((id, i) => req.input(`ConflitoIgnorar${i}`, sql.Int, id));
  const filtroIgnorar = ignorarIds.length
    ? `AND Id NOT IN (${ignorarIds.map((_, i) => `@ConflitoIgnorar${i}`).join(', ')})`
    : '';

  const result = await req
    .input('ConflitoClinicaId', sql.Int, clinicaId)
    .input('ConflitoData', sql.Date, data)
    .input('ConflitoHoraInicio', sql.VarChar(8), horaInicio + ':00')
    .input('ConflitoHoraFim', sql.VarChar(8), horaFim + ':00')
    .query(`
      SELECT 1
      FROM Agendamento WITH (UPDLOCK, HOLDLOCK)
      WHERE ClinicaId = @ConflitoClinicaId
        AND DataAgendamento = @ConflitoData
        AND Status != 'CANCELADO'
        ${filtroIgnorar}
        AND (
          CAST(@ConflitoHoraInicio AS TIME) < HoraFim
          AND CAST(@ConflitoHoraFim AS TIME) > HoraInicio
        )
    `);

  return result.recordset.length > 0;
}

module.exports = { existeConflitoAgendamento };
