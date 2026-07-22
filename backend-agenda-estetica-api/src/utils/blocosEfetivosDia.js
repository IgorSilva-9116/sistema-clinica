const { sql } = require('../config/database');
const { isSabadoAtivo } = require('./regraSabadoAlternado');

/**
 * Retorna os blocos efetivos de atendimento para uma data
 *
 * @param {number} clinicaId
 * @param {string} dataISO - YYYY-MM-DD
 */
async function obterBlocosEfetivosDia(clinicaId, dataISO) {
  const pool = await sql.connect();

  // ===============================
  // 1️⃣ CALCULAR DIA DA SEMANA (LOCAL)
  // ===============================
  const diaSemana = new Date(dataISO + 'T00:00:00').getDay(); // 0 (Dom) a 6 (Sáb)

  // ===============================
  // 1.1️⃣ SÁBADO ALTERNADO
  // ===============================
  if (diaSemana === 6) {

    const regraResult = await pool.request()
      .input('ClinicaId', sql.Int, clinicaId)
      .query(`
        SELECT
          DataInicio,
          HoraInicio,
          HoraFim
        FROM RegraRecorrenteAgenda
        WHERE ClinicaId = @ClinicaId
          AND Ativa = 1
          AND TipoRegra = 'SABADO_ALTERNADO'
      `);

    if (regraResult.recordset.length > 0) {

      const regra = regraResult.recordset[0];

      const ativo = isSabadoAtivo(
        new Date(regra.DataInicio),
        new Date(dataISO + 'T00:00:00')
      );

      if (!ativo) {
        return {
          aberto: false,
          origem: 'REGRA_RECORRENTE',
          blocos: []
        };
      }

      return {
        aberto: true,
        origem: 'REGRA_RECORRENTE',
        blocos: [
          {
            inicio: regra.HoraInicio
              .toISOString()
              .substring(11, 16),

            fim: regra.HoraFim
              .toISOString()
              .substring(11, 16)
          }
        ]
      };
    }
    // Não existe regra ativa para sábado
    return {
      aberto: false,
      origem: 'REGRA_RECORRENTE',
      blocos: []
    };
  }

  // ===============================
  // 2️⃣ BUSCAR BLOCOS DA AGENDA BASE
  // ===============================
  const baseResult = await pool.request()
    .input('ClinicaId', sql.Int, clinicaId)
    .input('DiaSemana', sql.Int, diaSemana)
    .query(`
      SELECT
        CONVERT(VARCHAR(5), HoraInicio, 108) AS Inicio,
        CONVERT(VARCHAR(5), HoraFim, 108) AS Fim
      FROM HorarioFuncionamento
      WHERE ClinicaId = @ClinicaId
        AND DiaSemana = @DiaSemana
        AND Ativo = 1
      ORDER BY HoraInicio
    `);

  let blocos = baseResult.recordset.map(b => ({
    inicio: b.Inicio,
    fim: b.Fim
  }));

  // ===============================
  // INTERVALOS RECORRENTES
  // ===============================

  const intervaloResult = await pool.request()
    .input('ClinicaId', sql.Int, clinicaId)
    .input('DiaSemana', sql.Int, diaSemana)
    .input('Data', sql.Date, dataISO)
    .query(`
    SELECT
      CONVERT(VARCHAR(5), HoraInicio, 108) AS HoraInicio,
      CONVERT(VARCHAR(5), HoraFim, 108) AS HoraFim,
      Descricao
    FROM IntervaloRecorrenteAgenda
    WHERE ClinicaId = @ClinicaId
      AND DiaSemana = @DiaSemana
      AND Ativo = 1
      AND (
        (DataInicio IS NULL AND DataFim IS NULL)
        OR
        (
          @Data >= ISNULL(DataInicio, @Data)
          AND
          @Data <= ISNULL(DataFim, @Data)
        )
      )
    ORDER BY HoraInicio
  `);

  const intervalos = intervaloResult.recordset;

  const intervalosRecorrentes = intervalos.map(i => ({
    inicio: i.HoraInicio,
    fim: i.HoraFim,
    descricao: i.Descricao
  }));

  console.log(
    'INTERVALOS RECORRENTES:',
    intervalos
  );

  // ===============================
  // APLICAR INTERVALOS RECORRENTES
  // ===============================

  for (const intervalo of intervalos) {

    blocos = removerIntervalo(
      blocos,
      intervalo.HoraInicio,
      intervalo.HoraFim
    );

  }

  // ===============================
  // 3️⃣ BUSCAR EXCEÇÕES DA DATA
  // ===============================
  const excecaoResult = await pool.request()
    .input('ClinicaId', sql.Int, clinicaId)
    .input('Data', sql.Date, dataISO)
    .query(`
      SELECT
        CONVERT(VARCHAR(5), HoraInicio, 108) AS Inicio,
        CONVERT(VARCHAR(5), HoraFim, 108) AS Fim,
        TipoExcecao
      FROM ExcecaoAgenda
      WHERE ClinicaId = @ClinicaId
        AND Ativa = 1
        AND (
          Data = @Data
          OR (@Data BETWEEN DataInicio AND DataFim)
        )
      ORDER BY HoraInicio
    `);

  const excecoes = excecaoResult.recordset;

  // ===============================
  // 4️⃣ APLICAR EXCEÇÕES
  // ===============================
  for (const exc of excecoes) {

    if (exc.TipoExcecao === 'ABRIR') {

      blocos.push({
        inicio: exc.Inicio,
        fim: exc.Fim
      });

    }

    // if (exc.TipoExcecao === 'FECHAR') {
    //   blocos = removerIntervalo(blocos, exc.Inicio, exc.Fim);
    // }

  }

  // ===============================
  // 5️⃣ NORMALIZAR
  // ===============================
  blocos = normalizarBlocos(blocos);

  // ===============================
  // 6️⃣ DECISÃO FINAL DO DIA
  // ===============================
  return {
    aberto: blocos.length > 0,
    origem: excecoes.length > 0 ? 'EXCECAO' : 'AGENDA_BASE',
    blocos,
    intervalosRecorrentes
  };
}

/* =====================================================
   REMOVE INTERVALO DE BLOCOS
===================================================== */
function removerIntervalo(blocos, inicioRem, fimRem) {
  const resultado = [];

  for (const bloco of blocos) {

    if (fimRem <= bloco.inicio || inicioRem >= bloco.fim) {
      resultado.push(bloco);
      continue;
    }

    if (inicioRem > bloco.inicio) {
      resultado.push({
        inicio: bloco.inicio,
        fim: inicioRem
      });
    }

    if (fimRem < bloco.fim) {
      resultado.push({
        inicio: fimRem,
        fim: bloco.fim
      });
    }
  }

  return resultado;
}

/* =====================================================
   NORMALIZA BLOCO
===================================================== */
function normalizarBlocos(blocos) {

  if (blocos.length === 0) return [];

  const ordenados = blocos.sort((a, b) =>
    a.inicio.localeCompare(b.inicio)
  );

  const resultado = [ordenados[0]];

  for (let i = 1; i < ordenados.length; i++) {

    const atual = ordenados[i];
    const ultimo = resultado[resultado.length - 1];

    if (atual.inicio <= ultimo.fim) {
      ultimo.fim =
        atual.fim > ultimo.fim
          ? atual.fim
          : ultimo.fim;
    } else {
      resultado.push(atual);
    }
  }

  return resultado;
}

module.exports = {
  obterBlocosEfetivosDia
};