const { sql } = require('../config/database');

/**
 * =========================
 * LISTAR REGRA ATIVA
 * =========================
 */
async function listarRegraAtiva(req, res) {
  try {
    if (req.userTipo !== 'clinica') {
      return res.status(403).json({ sucesso: false, mensagem: 'Acesso negado' });
    }

    const clinicaId = req.clinicaId;

    const result = await sql.connect().then(pool =>
      pool.request()
        .input('ClinicaId', sql.Int, clinicaId)
        .query(`
          SELECT
           Id,
           TipoRegra,
           DataInicio,
           HoraInicio,
           HoraFim,
           Ativa
          FROM RegraRecorrenteAgenda
          WHERE ClinicaId = @ClinicaId
            AND Ativa = 1
        `)
    );

    return res.json({
      sucesso: true,
      regra: result.recordset[0] || null
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao listar regra recorrente'
    });
  }
}

/**
 * =========================
 * CRIAR REGRA
 * =========================
 */
async function criarRegra(req, res) {
  try {
    if (req.userTipo !== 'clinica') {
      return res.status(403).json({ sucesso: false, mensagem: 'Acesso negado' });
    }

    const { tipoRegra, dataInicio, horaInicio, horaFim } = req.body;
      const clinicaId = req.clinicaId;

    if (!tipoRegra || !dataInicio) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Tipo de regra e data inicial são obrigatórios'
      });
    }
   
    await sql.connect().then(pool =>
      pool.request()
        .input('ClinicaId', sql.Int, clinicaId)
        .input('TipoRegra', sql.VarChar(50), tipoRegra)
        .input('DataInicio', sql.Date, dataInicio)
        .input('HoraInicio', sql.VarChar(8), `${horaInicio}:00`)
        .input('HoraFim', sql.VarChar(8), `${horaFim}:00`)
        .query(`
          INSERT INTO RegraRecorrenteAgenda
            (ClinicaId, TipoRegra, DataInicio, HoraInicio, HoraFim)
          VALUES
            (@ClinicaId, @TipoRegra, @DataInicio, CAST(@HoraInicio AS TIME), CAST(@HoraFim AS TIME) )
        `)
    );

    return res.status(201).json({
      sucesso: true,
      mensagem: 'Regra recorrente criada com sucesso'
    });

  } catch (error) {
    console.error(error);

    // Violação do índice único (uma regra ativa por clínica)
    if (error.number === 2601 || error.number === 2627) {
      return res.status(409).json({
        sucesso: false,
        mensagem: 'Já existe uma regra recorrente ativa para esta clínica'
      });
    }

    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao criar regra recorrente'
    });
  }
}

/**
 * =========================
 * DESATIVAR REGRA
 * =========================
 */
async function desativarRegra(req, res) {
  try {
    if (req.userTipo !== 'clinica') {
      return res.status(403).json({ sucesso: false, mensagem: 'Acesso negado' });
    }

    const { id } = req.params;

    await sql.connect().then(pool =>
      pool.request()
        .input('Id', sql.Int, Number(id))
        .query(`
          UPDATE RegraRecorrenteAgenda
          SET Ativa = 0
          WHERE Id = @Id
        `)
    );

    return res.json({
      sucesso: true,
      mensagem: 'Regra recorrente desativada'
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao desativar regra recorrente'
    });
  }
}

async function atualizarRegra(req, res) {
  try {

    if (req.userTipo !== 'clinica') {
      return res.status(403).json({
        sucesso: false,
        mensagem: 'Acesso negado'
      });
    }

    const { id } = req.params;

    const {
      dataInicio,
      horaInicio,
      horaFim
    } = req.body;

    await sql.connect().then(pool =>
      pool.request()
        .input('Id', sql.Int, Number(id))
        .input('DataInicio', sql.Date, dataInicio)
        .input('HoraInicio', sql.VarChar(8), `${horaInicio}:00`)
        .input('HoraFim', sql.VarChar(8), `${horaFim}:00`)
        .query(`
          UPDATE RegraRecorrenteAgenda
          SET
            DataInicio = @DataInicio,
            HoraInicio = CAST(@HoraInicio AS TIME),
            HoraFim = CAST(@HoraFim AS TIME)
          WHERE Id = @Id
        `)
    );

    return res.json({
      sucesso: true,
      mensagem: 'Regra atualizada com sucesso'
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao atualizar regra'
    });

  }
}

module.exports = {
  listarRegraAtiva,
  criarRegra,
  atualizarRegra,
  desativarRegra
};