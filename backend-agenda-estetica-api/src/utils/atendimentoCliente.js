const { sql } = require('../config/database');
const { minutosAte } = require('./dataHoraBrasil');

/**
 * "Atendimento" = a visita da cliente: um agendamento sozinho ou os
 * vários serviços marcados juntos (mesmo GrupoAgendamento).
 */

const ATIVOS = ['CRIADO', 'CONFIRMADO'];

const paraISO = data => new Date(data).toISOString().slice(0, 10);

/**
 * Itens do atendimento ao qual o agendamento pertence, só se forem
 * desta cliente nesta clínica. Retorna [] se não encontrar.
 */
async function buscarItensAtendimento(pool, { agendamentoId, clienteId, clinicaId }) {
  const result = await pool.request()
    .input('Id', sql.Int, Number(agendamentoId))
    .input('ClienteId', sql.Int, clienteId)
    .input('ClinicaId', sql.Int, clinicaId)
    .query(`
      SELECT
        a.Id,
        a.ServicoId,
        a.DataAgendamento,
        CONVERT(VARCHAR(5), a.HoraInicio, 108) AS HoraInicio,
        CONVERT(VARCHAR(5), a.HoraFim, 108) AS HoraFim,
        a.Status,
        a.ValorServico,
        a.GrupoAgendamento,
        s.Titulo,
        s.DuracaoMinutos
      FROM Agendamento a
      JOIN Servico s ON s.Id = a.ServicoId
      JOIN Agendamento ref ON ref.Id = @Id
      WHERE a.ClienteId = @ClienteId
        AND a.ClinicaId = @ClinicaId
        AND ref.ClienteId = @ClienteId
        AND (a.Id = @Id OR (ref.GrupoAgendamento IS NOT NULL AND a.GrupoAgendamento = ref.GrupoAgendamento))
      ORDER BY a.HoraInicio
    `);

  return result.recordset;
}

/**
 * Regras de cancelamento/remarcação para um atendimento,
 * conforme a Política de Cancelamento da clínica.
 */
function avaliarPrazo(itensAtivos, politica) {
  if (itensAtivos.length === 0) {
    return { futuro: false, dentroDaJanela: false, multaPercentual: 0, valorMulta: 0 };
  }

  const primeiro = itensAtivos[0];
  const faltam = minutosAte(paraISO(primeiro.DataAgendamento), primeiro.HoraInicio);
  const janelaMinutos = Number(politica.JanelaCancelamentoHoras || 0) * 60;
  const percentual = Number(politica.MultaPercentual || 0);

  // "Dentro da janela" = em cima da hora (menos antecedência que a política exige)
  const dentroDaJanela = janelaMinutos > 0 && faltam < janelaMinutos;
  const valorTotal = itensAtivos.reduce((t, i) => t + Number(i.ValorServico || 0), 0);
  const multaPercentual = dentroDaJanela ? percentual : 0;

  return {
    futuro: faltam > 0,
    dentroDaJanela,
    multaPercentual,
    valorMulta: Number((valorTotal * multaPercentual / 100).toFixed(2))
  };
}

async function obterPoliticaCancelamento(pool, clinicaId) {
  const result = await pool.request()
    .input('ClinicaId', sql.Int, clinicaId)
    .query(`
      SELECT JanelaCancelamentoHoras, MultaPercentual
      FROM ConfiguracaoClinica
      WHERE ClinicaId = @ClinicaId
    `);

  return result.recordset[0] || { JanelaCancelamentoHoras: 0, MultaPercentual: 0 };
}

module.exports = {
  ATIVOS,
  paraISO,
  buscarItensAtendimento,
  avaliarPrazo,
  obterPoliticaCancelamento
};
