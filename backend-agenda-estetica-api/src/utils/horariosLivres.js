const { sql } = require('../config/database');
const { obterBlocosEfetivosDia } = require('./blocosEfetivosDia');
const { agoraBrasil, somarDias } = require('./dataHoraBrasil');

const PASSO_MINUTOS = 15;

// Para o mesmo dia, a cliente só agenda com esta antecedência
const ANTECEDENCIA_MINIMA_MINUTOS = 60;

const paraMinutos = hora => {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
};

const paraHora = minutos =>
  `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;

const paraISO = data => (data ? new Date(data).toISOString().slice(0, 10) : null);

/**
 * Período em que a cliente pode agendar, conforme a configuração
 * da agenda (mesmas regras usadas ao criar agendamento pela clínica).
 * Retorna null quando a agenda não está liberada.
 */
async function obterJanelaAgendamento(pool, clinicaId) {
  const result = await pool.request()
    .input('ClinicaId', sql.Int, clinicaId)
    .query(`
      SELECT DiasLiberacaoAgenda, DataLimiteAgenda, DataFechamentoAgenda
      FROM ConfiguracaoClinica
      WHERE ClinicaId = @ClinicaId
    `);

  const config = result.recordset[0] || {};
  const hoje = agoraBrasil().data;

  let dataMaxima = null;
  if (config.DataLimiteAgenda) {
    dataMaxima = paraISO(config.DataLimiteAgenda);
  } else if (Number(config.DiasLiberacaoAgenda) > 0) {
    dataMaxima = somarDias(hoje, Number(config.DiasLiberacaoAgenda));
  }

  let dataMinima = hoje;
  const fechamento = paraISO(config.DataFechamentoAgenda);
  if (fechamento && fechamento >= dataMinima) {
    dataMinima = somarDias(fechamento, 1);
  }

  if (!dataMaxima || dataMaxima < dataMinima) {
    return null;
  }

  return { dataMinima, dataMaxima };
}

/**
 * Remove os períodos ocupados dos blocos livres
 */
function subtrairPeriodos(blocos, ocupados) {
  let livres = blocos.map(b => ({ inicio: paraMinutos(b.inicio), fim: paraMinutos(b.fim) }));

  for (const o of ocupados) {
    const oInicio = paraMinutos(o.inicio);
    const oFim = paraMinutos(o.fim);
    const resultado = [];

    for (const b of livres) {
      if (oFim <= b.inicio || oInicio >= b.fim) {
        resultado.push(b);
        continue;
      }
      if (oInicio > b.inicio) resultado.push({ inicio: b.inicio, fim: oInicio });
      if (oFim < b.fim) resultado.push({ inicio: oFim, fim: b.fim });
    }

    livres = resultado;
  }

  return livres;
}

/**
 * Horários de início livres para um serviço numa data.
 * Considera: agenda base, sábado alternado, intervalos, exceções
 * (ABRIR e FECHAR), agendamentos existentes, a duração inteira do
 * serviço, a janela de liberação e o horário atual.
 *
 * @param {object} pool conexão (ou transação) do mssql
 * @param {{ clinicaId: number, data: string, duracaoMinutos: number, janela?: object, ignorarIds?: number[] }} params
 *        ignorarIds: agendamentos que não contam como ocupados (remarcação)
 * @returns {Promise<string[]>} horários HH:mm
 */
async function calcularHorariosLivres(pool, { clinicaId, data, duracaoMinutos, janela, ignorarIds = [] }) {
  const periodo = janela === undefined ? await obterJanelaAgendamento(pool, clinicaId) : janela;

  if (!periodo || data < periodo.dataMinima || data > periodo.dataMaxima) {
    return [];
  }

  const dia = await obterBlocosEfetivosDia(clinicaId, data);
  if (!dia.aberto) return [];

  const request = pool.request()
    .input('ClinicaId', sql.Int, clinicaId)
    .input('Data', sql.Date, data);
  ignorarIds.forEach((id, i) => request.input(`Ignorar${i}`, sql.Int, id));
  const filtroIgnorar = ignorarIds.length
    ? `AND Id NOT IN (${ignorarIds.map((_, i) => `@Ignorar${i}`).join(', ')})`
    : '';

  const ocupadosResult = await request.query(`
      SELECT
        CONVERT(VARCHAR(5), HoraInicio, 108) AS inicio,
        CONVERT(VARCHAR(5), HoraFim, 108) AS fim
      FROM ExcecaoAgenda
      WHERE ClinicaId = @ClinicaId
        AND Ativa = 1
        AND TipoExcecao = 'FECHAR'
        AND (Data = @Data OR @Data BETWEEN DataInicio AND DataFim)

      UNION ALL

      SELECT
        CONVERT(VARCHAR(5), HoraInicio, 108),
        CONVERT(VARCHAR(5), HoraFim, 108)
      FROM Agendamento
      WHERE ClinicaId = @ClinicaId
        AND DataAgendamento = @Data
        AND Status <> 'CANCELADO'
        ${filtroIgnorar}
    `);

  const ocupados = ocupadosResult.recordset;

  // Bloqueio sem horário = dia inteiro fechado
  if (ocupados.some(o => !o.inicio || !o.fim)) return [];

  const livres = subtrairPeriodos(dia.blocos, ocupados);

  const agora = agoraBrasil();
  const inicioMinimo = data === agora.data ? agora.minutos + ANTECEDENCIA_MINIMA_MINUTOS : 0;

  const horarios = [];
  for (const bloco of livres) {
    // Começa no primeiro múltiplo de 15 min dentro do bloco
    let inicio = Math.ceil(bloco.inicio / PASSO_MINUTOS) * PASSO_MINUTOS;

    while (inicio + duracaoMinutos <= bloco.fim) {
      if (inicio >= inicioMinimo) horarios.push(paraHora(inicio));
      inicio += PASSO_MINUTOS;
    }
  }

  return horarios;
}

module.exports = {
  obterJanelaAgendamento,
  calcularHorariosLivres,
  paraMinutos,
  paraHora
};
