const { sql } = require('../config/database');

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
  // 5️⃣ NORMALIZAR (ORDENAR E MESCLAR)
  // ===============================
  blocos = normalizarBlocos(blocos);

  // ===============================
  // 6️⃣ DECISÃO FINAL DO DIA
  // ===============================
  return {
    aberto: blocos.length > 0,
    origem: excecoes.length > 0 ? 'EXCECAO' : 'AGENDA_BASE',
    blocos
  };
}

/* =====================================================
   REMOVE INTERVALO DE BLOCOS
===================================================== */
function removerIntervalo(blocos, inicioRem, fimRem) {
  const resultado = [];

  for (const bloco of blocos) {
    // Sem interseção
    if (fimRem <= bloco.inicio || inicioRem >= bloco.fim) {
      resultado.push(bloco);
      continue;
    }

    // Corte à esquerda
    if (inicioRem > bloco.inicio) {
      resultado.push({
        inicio: bloco.inicio,
        fim: inicioRem
      });
    }

    // Corte à direita
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
   NORMALIZA BLOCO (ORDENA E MESCLA)
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
      ultimo.fim = atual.fim > ultimo.fim ? atual.fim : ultimo.fim;
    } else {
      resultado.push(atual);
    }
  }

  return resultado;
}

module.exports = {
  obterBlocosEfetivosDia
};
