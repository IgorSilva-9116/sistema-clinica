const { sql } = require('../config/database');

/**
 * =========================
 * LISTAR PROFISSIONAIS
 * =========================
 * Acessível por:
 * - clínica
 */
async function listarProfissionais(req, res) {
  try {
    const result = await sql.connect().then(pool =>
      pool.request()
        .input('ClinicaId', sql.Int, req.clinicaId)
        .query(`
            SELECT
           Id   AS id,
           Nome AS nome
           FROM Profissional
           WHERE ClinicaId = @ClinicaId
           AND Ativo = 1
        `)
    )

    return res.status(200).json({
      sucesso: true,
      profissionais: result.recordset
    })

  } catch (error) {
    console.error('Erro ao listar profissionais:', error)
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao listar profissionais'
    })
  }
}


/**
 * =========================
 * CRIAR PROFISSIONAL
 * =========================
 * Acessível por:
 * - clínica
 */
async function criarProfissional(req, res) {
  try {
    const { nome, ehDona } = req.body;

    if (!nome) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Nome do profissional é obrigatório'
      });
    }

    await sql.connect().then(pool =>
      pool.request()
        .input('ClinicaId', sql.Int, req.clinicaId)
        .input('Nome', sql.VarChar(150), nome)
        .input('EhDona', sql.Bit, ehDona ? 1 : 0)
        .query(`
          INSERT INTO Profissional
          (
            ClinicaId,
            Nome,
            Ativo,
            EhDona,
            DataCadastro
          )
          VALUES
          (
            @ClinicaId,
            @Nome,
            1,
            @EhDona,
            GETDATE()
          )
        `)
    );

    return res.status(201).json({
      sucesso: true,
      mensagem: 'Profissional criado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao criar profissional:', error);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno ao criar profissional'
    });
  }
}

/**
 * =========================
 * ATUALIZAR PROFISSIONAL
 * =========================
 * Acessível por:
 * - clínica
 */
async function atualizarProfissional(req, res) {
  try {
    const { id } = req.params;
    const { nome, ativo, ehDona } = req.body;

    if (!id) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'ID do profissional é obrigatório'
      });
    }

    await sql.connect().then(pool =>
      pool.request()
        .input('Id', sql.Int, id)
        .input('Nome', sql.VarChar(150), nome)
        .input('Ativo', sql.Bit, ativo)
        .input('EhDona', sql.Bit, ehDona)
        .query(`
          UPDATE Profissional
          SET
            Nome = ISNULL(@Nome, Nome),
            Ativo = ISNULL(@Ativo, Ativo),
            EhDona = ISNULL(@EhDona, EhDona)
          WHERE Id = @Id
        `)
    );

    return res.status(200).json({
      sucesso: true,
      mensagem: 'Profissional atualizado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar profissional:', error);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno ao atualizar profissional'
    });
  }
}

module.exports = {
  listarProfissionais,
  criarProfissional,
  atualizarProfissional
};
