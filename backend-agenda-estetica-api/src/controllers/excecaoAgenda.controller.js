const { sql } = require('../config/database');

/**
 * =========================
 * LISTAR EXCEÇÕES POR DATA
 * (pontual ou por período)
 * =========================
 */
async function listarExcecoesPorData(req, res) {
  try {
    if (req.userTipo !== 'clinica') {
      return res.status(403).json({ sucesso: false, mensagem: 'Acesso negado' });
    }

    const clinicaId = req.clinicaId;
    const { data } = req.query;

    if (!data) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Parâmetro data é obrigatório'
      });
    }

    const pool = await sql.connect();

    const result = await pool.request()
      .input('ClinicaId', sql.Int, clinicaId)
      .input('Data', sql.Date, data)
      .query(`
        SELECT
          Id,
          Data,
          DataInicio,
          DataFim,
          CONVERT(VARCHAR(5), HoraInicio, 108) AS HoraInicio,
          CONVERT(VARCHAR(5), HoraFim, 108) AS HoraFim,
          TipoExcecao,
          Observacao,
          Ativa
        FROM ExcecaoAgenda
        WHERE ClinicaId = @ClinicaId
          AND Ativa = 1
          AND (
                Data = @Data
             OR (
                  DataInicio IS NOT NULL
                  AND DataFim IS NOT NULL
                  AND @Data BETWEEN DataInicio AND DataFim
                )
          )
        ORDER BY HoraInicio
      `);

    return res.status(200).json({
      sucesso: true,
      excecoes: result.recordset || []
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao listar exceções'
    });
  }
}

/**
 * =========================
 * LISTAR EXCEÇÕES TODAS
 * =========================
 */
async function listarTodasExcecoes(req, res) {
  try {
    if (req.userTipo !== 'clinica') {
      return res.status(403).json({ sucesso: false, mensagem: 'Acesso negado' });
    }

    const clinicaId = req.clinicaId;
    const pool = await sql.connect();

    const result = await pool.request()
      .input('ClinicaId', sql.Int, clinicaId)
      .query(`
        SELECT
          Id,
          Data,
          DataInicio,
          DataFim,
          CONVERT(VARCHAR(5), HoraInicio, 108) AS HoraInicio,
          CONVERT(VARCHAR(5), HoraFim, 108) AS HoraFim,
          TipoExcecao,
          Observacao,
          Ativa
        FROM ExcecaoAgenda
        WHERE ClinicaId = @ClinicaId
        ORDER BY
          COALESCE(DataInicio, Data),
          HoraInicio
      `);

    return res.json({
      sucesso: true,
      excecoes: result.recordset
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao listar exceções'
    });
  }
}

/**
 * =========================
 * LISTAR DIAS COM EXCEÇÃO
 * =========================
 */
async function listarDiasComExcecao(req, res) {
  try {
    if (req.userTipo !== 'clinica') {
      return res.status(403).json({ sucesso: false });
    }

    const clinicaId = req.clinicaId;
    const { mes } = req.query; // YYYY-MM

    if (!mes) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Parâmetro mes é obrigatório'
      });
    }

    const inicioMes = `${mes}-01`;
    const fimMes = `${mes}-31`;

    const pool = await sql.connect();

    const result = await pool.request()
      .input('ClinicaId', sql.Int, clinicaId)
      .input('InicioMes', sql.Date, inicioMes)
      .input('FimMes', sql.Date, fimMes)
      .query(`
        ;WITH Intervalos AS (
          SELECT
            CASE
              WHEN DataInicio IS NOT NULL THEN DataInicio
              ELSE Data
            END AS Inicio,
            ISNULL(DataFim, Data) AS Fim
          FROM ExcecaoAgenda
          WHERE ClinicaId = @ClinicaId
            AND Ativa = 1
            AND (
              Data BETWEEN @InicioMes AND @FimMes
              OR (
                DataInicio <= @FimMes
                AND DataFim >= @InicioMes
              )
            )
        ),
        DiasExpandido AS (
          SELECT Inicio AS Dia, Fim
          FROM Intervalos
          UNION ALL
          SELECT DATEADD(day, 1, Dia), Fim
          FROM DiasExpandido
          WHERE Dia < Fim
        )
        SELECT DISTINCT CONVERT(date, Dia) AS Dia
        FROM DiasExpandido
        WHERE Dia BETWEEN @InicioMes AND @FimMes
        OPTION (MAXRECURSION 1000)
      `);

    return res.json({
      sucesso: true,
      dias: result.recordset.map(r =>
        r.Dia.toISOString().slice(0, 10)
      )
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ sucesso: false });
  }
}

/**
 * =========================
 * CRIAR EXCEÇÃO PONTUAL
 * =========================
 */
async function criarExcecao(req, res) {
  try {
    if (req.userTipo !== 'clinica') {
      return res.status(403).json({ sucesso: false, mensagem: 'Acesso negado' });
    }

    const clinicaId = req.clinicaId;
    const { data, horaInicio, horaFim, tipoExcecao, observacao } = req.body;

    if (!data || !horaInicio || !horaFim || !tipoExcecao) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Dados obrigatórios não informados'
      });
    }

    const pool = await sql.connect();

    await pool.request()
      .input('ClinicaId', sql.Int, clinicaId)
      .input('Data', sql.Date, data)
      .input('HoraInicio', sql.VarChar(8), horaInicio + ':00')
      .input('HoraFim', sql.VarChar(8), horaFim + ':00')
      .input('TipoExcecao', sql.VarChar(10), tipoExcecao)
      .input('Observacao', sql.VarChar(255), observacao || null)
      .query(`
        INSERT INTO ExcecaoAgenda
          (ClinicaId, Data, HoraInicio, HoraFim, TipoExcecao, Observacao, Ativa)
        VALUES
          (
            @ClinicaId,
            @Data,
            CAST(@HoraInicio AS TIME),
            CAST(@HoraFim AS TIME),
            @TipoExcecao,
            @Observacao,
            1
          )
      `);

    return res.status(201).json({
      sucesso: true,
      mensagem: 'Exceção criada com sucesso'
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao criar exceção'
    });
  }
}

/**
 * =========================
 * CRIAR EXCEÇÃO POR PERÍODO
 * =========================
 */
async function criarExcecaoPeriodo(req, res) {
  try {
    if (req.userTipo !== 'clinica') {
      return res.status(403).json({ sucesso: false, mensagem: 'Acesso negado' });
    }

    const clinicaId = req.clinicaId;
    const {
      dataInicio,
      dataFim,
      horaInicio,
      horaFim,
      tipoExcecao,
      observacao
    } = req.body;

    if (!dataInicio || !dataFim || !horaInicio || !horaFim || !tipoExcecao) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Dados obrigatórios não informados'
      });
    }

    if (dataInicio > dataFim) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Data início não pode ser maior que data fim'
      });
    }

    const pool = await sql.connect();

    // 🔑 Data recebe DataInicio para evitar NULL (compatibilidade)
    await pool.request()
      .input('ClinicaId', sql.Int, clinicaId)
      .input('Data', sql.Date, dataInicio)
      .input('DataInicio', sql.Date, dataInicio)
      .input('DataFim', sql.Date, dataFim)
      .input('HoraInicio', sql.VarChar(8), horaInicio + ':00')
      .input('HoraFim', sql.VarChar(8), horaFim + ':00')
      .input('TipoExcecao', sql.VarChar(10), tipoExcecao)
      .input('Observacao', sql.VarChar(255), observacao || null)
      .query(`
        INSERT INTO ExcecaoAgenda
          (
            ClinicaId,
            Data,
            DataInicio,
            DataFim,
            HoraInicio,
            HoraFim,
            TipoExcecao,
            Observacao,
            Ativa
          )
        VALUES
          (
            @ClinicaId,
            @Data,
            @DataInicio,
            @DataFim,
            CAST(@HoraInicio AS TIME),
            CAST(@HoraFim AS TIME),
            @TipoExcecao,
            @Observacao,
            1
          )
      `);

    return res.status(201).json({
      sucesso: true,
      mensagem: 'Exceção por período criada com sucesso'
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao criar exceção por período'
    });
  }
}

/**
 * =========================
 * ATIVA/ DESATIVAE EXCEÇÂO
 * =========================
 */

async function alterarAtivaExcecao(req, res) {
  try {
    if (req.userTipo !== 'clinica') {
      return res.status(403).json({ sucesso: false, mensagem: 'Acesso negado' });
    }

    const { id } = req.params;
    const { ativa } = req.body;

    const pool = await sql.connect();

    await pool.request()
      .input('Id', sql.Int, Number(id))
      .input('Ativa', sql.Bit, ativa ? 1 : 0)
      .query(`
        UPDATE ExcecaoAgenda
        SET Ativa = @Ativa
        WHERE Id = @Id
      `);

    return res.json({
      sucesso: true,
      mensagem: ativa ? 'Exceção ativada' : 'Exceção desativada'
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao alterar status da exceção'
    });
  }
}

/**
 * =========================
 * REMOVER EXCEÇÃO
 * =========================
 */
async function removerExcecao(req, res) {
  try {
    if (req.userTipo !== 'clinica') {
      return res.status(403).json({ sucesso: false, mensagem: 'Acesso negado' });
    }

    const { id } = req.params;

    const pool = await sql.connect();
    await pool.request()
      .input('Id', sql.Int, Number(id))
      .query(`
        DELETE FROM ExcecaoAgenda
        WHERE Id = @Id
      `);

    return res.json({
      sucesso: true,
      mensagem: 'Exceção removida com sucesso'
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao remover exceção'
    });
  }
}

module.exports = {
  listarExcecoesPorData,
  listarDiasComExcecao,
  criarExcecao,
  criarExcecaoPeriodo,
  removerExcecao,
  listarTodasExcecoes,
  alterarAtivaExcecao
};