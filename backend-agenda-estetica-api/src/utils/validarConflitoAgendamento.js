const { sql } = require('../config/database');

/**
 * Verifica se existe conflito de agendamento
 */
async function existeConflitoAgendamento(
  clinicaId,
  data,
  horaInicio,
  horaFim
) {
  const pool = await sql.connect();

  const result = await pool.request()
    .input('ClinicaId', sql.Int, clinicaId)
    .input('DataAgendamento', sql.Date, data)
    .input('HoraInicio', sql.VarChar(8), horaInicio + ':00')
    .input('HoraFim', sql.VarChar(8), horaFim + ':00')
    .query(`
      SELECT 1
      FROM Agendamento
      WHERE ClinicaId = @ClinicaId
        AND DataAgendamento = @DataAgendamento
        AND Status != 'CANCELADO'
        AND (
          CAST(@HoraInicio AS TIME) < HoraFim
          AND CAST(@HoraFim AS TIME) > HoraInicio
        )
    `);

  return result.recordset.length > 0;
}

module.exports = { existeConflitoAgendamento };
