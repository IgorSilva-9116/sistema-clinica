const { sql } = require('../config/database');
const { isSabadoAtivo } = require('./regraSabadoAlternado');

/**
 * Decide se o dia está aberto ou fechado
 * respeitando a ordem:
 * 1) Exceção
 * 2) Regra recorrente
 * 3) Agenda base
 *
 * @param {number} clinicaId
 * @param {string} dataISO - YYYY-MM-DD
 * @returns {Promise<{ aberto: boolean, origem: string }>}
 */
async function decidirDiaAberto(clinicaId, dataISO) {
  const pool = await sql.connect();

  // 1️⃣ Verificar exceções (prioridade máxima)
  const excecao = await pool.request()
    .input('ClinicaId', sql.Int, clinicaId)
    .input('Data', sql.Date, dataISO)
    .query(`
      SELECT TipoExcecao
      FROM ExcecaoAgenda
      WHERE ClinicaId = @ClinicaId
        AND Data = @Data
    `);

  if (excecao.recordset.length > 0) {
    // Se existir qualquer FECHAR, o dia é fechado
    const temFechar = excecao.recordset.some(e => e.TipoExcecao === 'FECHAR');

    return {
      aberto: !temFechar,
      origem: 'EXCECAO'
    };
  }

  // 2️⃣ Verificar regra recorrente (sábado alternado)
  const regra = await pool.request()
    .input('ClinicaId', sql.Int, clinicaId)
    .query(`
      SELECT TipoRegra, DataInicio
      FROM RegraRecorrenteAgenda
      WHERE ClinicaId = @ClinicaId
        AND Ativa = 1
    `);

  if (regra.recordset.length > 0) {
    const { TipoRegra, DataInicio } = regra.recordset[0];

    const data = new Date(dataISO);

    if (TipoRegra === 'SABADO_ALTERNADO' && data.getDay() === 6) {
      const ativo = isSabadoAtivo(new Date(DataInicio), data);

      return {
        aberto: ativo,
        origem: 'REGRA_RECORRENTE'
      };
    }
  }

  // 3️⃣ Verificar agenda base
  const diaSemana = new Date(dataISO).getDay(); // 0 = domingo

  const agendaBase = await pool.request()
    .input('ClinicaId', sql.Int, clinicaId)
    .input('DiaSemana', sql.Int, diaSemana)
    .query(`
      SELECT Ativo
      FROM HorarioFuncionamento
      WHERE ClinicaId = @ClinicaId
        AND DiaSemana = @DiaSemana
    `);

  if (agendaBase.recordset.length === 0) {
    return {
      aberto: false,
      origem: 'AGENDA_BASE'
    };
  }

  return {
    aberto: agendaBase.recordset[0].Ativo === true,
    origem: 'AGENDA_BASE'
  };
}

module.exports = {
  decidirDiaAberto
};
