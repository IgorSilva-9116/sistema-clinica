const { sql } = require('../config/database');

/**
 * =========================
 * LISTAR AGENDA BASE
 * =========================
 */
async function listarAgendaBase(req, res) {
  try {
    if (req.userTipo !== 'clinica') {
      return res.status(403).json({
        sucesso: false,
        mensagem: 'Acesso negado'
      });
    }

    const clinicaId = req.clinicaId;

    const result = await sql.connect().then(pool =>
      pool.request()
        .input('ClinicaId', sql.Int, clinicaId)
        .query(`
          SELECT
            Id AS id,
            DiaSemana AS diaSemana,
            CONVERT(VARCHAR(5), HoraInicio, 108) AS horaInicio,
            CONVERT(VARCHAR(5), HoraFim, 108) AS horaFim,
            Ativo AS ativo
          FROM HorarioFuncionamento
          WHERE ClinicaId = @ClinicaId
          ORDER BY DiaSemana
        `)
    );

    res.set('Cache-Control', 'no-store');

    return res.json({
      sucesso: true,
      agenda: result.recordset
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao listar agenda base'
    });
  }
}

/**
 * =========================
 * ATUALIZAR HORÁRIO BASE
 * =========================
 */
async function atualizarAgendaBase(req, res) {
  try {
    if (req.userTipo !== 'clinica') {
      return res.status(403).json({
        sucesso: false,
        mensagem: 'Acesso negado'
      });
    }

    const { id } = req.params;
    const { horaInicio, horaFim } = req.body;
    const clinicaId = req.clinicaId;

    if (!horaInicio || !horaFim) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Hora início e hora fim são obrigatórios'
      });
    }

    await sql.connect().then(pool =>
      pool.request()
        .input('Id', sql.Int, Number(id))
        .input('ClinicaId', sql.Int, clinicaId)
        .input('HoraInicio', sql.VarChar(8), horaInicio + ':00')
        .input('HoraFim', sql.VarChar(8), horaFim + ':00')
        .query(`
          UPDATE HorarioFuncionamento
          SET
            HoraInicio = CAST(@HoraInicio AS TIME),
            HoraFim = CAST(@HoraFim AS TIME)
          WHERE Id = @Id
            AND ClinicaId = @ClinicaId
        `)
    );

    return res.json({
      sucesso: true,
      mensagem: 'Horário atualizado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar agenda base:', error);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao atualizar agenda base'
    });
  }
}

/**
 * =========================
 * ATIVAR DIA
 * =========================
 */
async function ativarDia(req, res) {
  try {
    if (req.userTipo !== 'clinica') {
      return res.status(403).json({
        sucesso: false,
        mensagem: 'Acesso negado'
      });
    }

    const { id } = req.params;

    await sql.connect().then(pool =>
      pool.request()
        .input('Id', sql.Int, Number(id))
        .query(`
          UPDATE HorarioFuncionamento
          SET Ativo = 1
          WHERE Id = @Id
        `)
    );

    res.set('Cache-Control', 'no-store');

    return res.status(200).json({
      sucesso: true,
      mensagem: 'Dia ativado com sucesso'
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao ativar dia'
    });
  }
}

/**
 * =========================
 * DESATIVAR DIA
 * =========================
 */
async function desativarDia(req, res) {
  try {
    if (req.userTipo !== 'clinica') {
      return res.status(403).json({
        sucesso: false,
        mensagem: 'Acesso negado'
      });
    }

    const { id } = req.params;

    await sql.connect().then(pool =>
      pool.request()
        .input('Id', sql.Int, Number(id))
        .query(`
          UPDATE HorarioFuncionamento
          SET Ativo = 0
          WHERE Id = @Id
        `)
    );

    res.set('Cache-Control', 'no-store');

    return res.status(200).json({
      sucesso: true,
      mensagem: 'Dia desativado com sucesso'
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao desativar dia'
    });
  }
}

module.exports = {
  listarAgendaBase,
  atualizarAgendaBase,
  ativarDia,
  desativarDia
};
