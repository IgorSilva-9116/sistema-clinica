const { sql } = require('../config/database');

/**
 * =========================
 * OBTER CONFIGURAÇÕES DA CLÍNICA
 * =========================
 */
async function obterConfiguracoes(req, res) {
  try {
    if (req.userTipo !== 'clinica') {
      return res.status(403).json({
        sucesso: false,
        mensagem: 'Apenas clínicas podem acessar as configurações'
      });
    }

    const clinicaId = req.clinicaId;
    const pool = await sql.connect();

    const result = await pool.request()
      .input('ClinicaId', sql.Int, clinicaId)
     .query(`
        SELECT
        JanelaCancelamentoHoras,
        MultaPercentual,
        DiasLiberacaoAgenda,
        DataLimiteAgenda,
        DataFechamentoAgenda
      FROM ConfiguracaoClinica
      WHERE ClinicaId = @ClinicaId
    `);

    if (result.recordset.length === 0) {
      // fallback seguro (caso não exista registro)
      return res.json({
       janelaCancelamentoHoras: 0,
       multaPercentual: 0,
       DiasLiberacaoAgenda: 0,
       DataLimiteAgenda: null
      });
    }

    return res.json(result.recordset[0]);

  } catch (err) {
    console.error('Erro ao obter configurações:', err);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao obter configurações da clínica'
    });
  }
}

/**
 * =========================
 * ATUALIZAR CONFIGURAÇÕES DA CLÍNICA
 * =========================
 */
async function atualizarConfiguracoes(req, res) {
  try {
    if (req.userTipo !== 'clinica') {
      return res.status(403).json({
        sucesso: false,
        mensagem: 'Apenas clínicas podem alterar as configurações'
      });
    }

    const clinicaId = req.clinicaId;

    const {
      DiasLiberacaoAgenda,
      DataLimiteAgenda,
      DataFechamentoAgenda,
      janelaCancelamentoHoras,
      multaPercentual
    } = req.body;

    if (DiasLiberacaoAgenda == null) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Dias de liberação não informado'
      });
    }

    const pool = await sql.connect();

    // Upsert simples
    await pool.request()
      .input('ClinicaId', sql.Int, clinicaId)
      .input('JanelaCancelamentoHoras', sql.Int, janelaCancelamentoHoras ?? 0)
      .input('MultaPercentual', sql.Decimal(5, 2), multaPercentual ?? 0)
      .input('DiasLiberacaoAgenda', sql.Int, DiasLiberacaoAgenda)
      .input('DataLimiteAgenda', sql.Date, DataLimiteAgenda ?? null)
      .input('DataFechamentoAgenda', sql.Date, DataFechamentoAgenda ?? null)

      .query(`
        IF EXISTS (
          SELECT 1
          FROM ConfiguracaoClinica
          WHERE ClinicaId = @ClinicaId
        )
        BEGIN
          UPDATE ConfiguracaoClinica
          SET
            JanelaCancelamentoHoras = @JanelaCancelamentoHoras,
            MultaPercentual = @MultaPercentual,
            DiasLiberacaoAgenda = @DiasLiberacaoAgenda,
            DataLimiteAgenda = @DataLimiteAgenda,
            DataFechamentoAgenda = @DataFechamentoAgenda
          WHERE ClinicaId = @ClinicaId
        END    
        ELSE
        BEGIN
        INSERT INTO ConfiguracaoClinica
          (ClinicaId, JanelaCancelamentoHoras, MultaPercentual, DiasLiberacaoAgenda, DataLimiteAgenda, DataFechamentoAgenda)
        VALUES
          (@ClinicaId, @JanelaCancelamentoHoras, @MultaPercentual, @DiasLiberacaoAgenda, @DataLimiteAgenda, @DataFechamentoAgenda)
        END
      `);

    return res.json({
      sucesso: true,
      mensagem: 'Configurações atualizadas com sucesso'
    });

  } catch (err) {
    console.error('Erro ao atualizar configurações:', err);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao atualizar configurações da clínica'
    });
  }
}

/**
 * =========================
 * OBTER PLITICA DA CLÍNICA
 * =========================
 */
async function obterPolitica(req, res) {
  try {
    const clinicaId = req.clinicaId;

    const result = await sql.connect().then(pool =>
      pool.request()
        .input('ClinicaId', sql.Int, clinicaId)
        .query(`
          SELECT PoliticaAgendamento
          FROM Clinica
          WHERE Id = @ClinicaId
        `)
    );

    return res.json({
      sucesso: true,
      politica: result.recordset[0]?.PoliticaAgendamento || ''
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: 'Erro ao buscar política' });
  }
}

/**
 * =========================
 * ATUALIZAR POLITICA DA CLÍNICA
 * =========================
 */
async function atualizarPolitica(req, res) {
  try {
    const clinicaId = req.clinicaId;
    const { politica } = req.body;

    await sql.connect().then(pool =>
      pool.request()
        .input('ClinicaId', sql.Int, clinicaId)
        .input('Politica', sql.VarChar(1000), politica)
        .query(`
          UPDATE Clinica
          SET PoliticaAgendamento = @Politica
          WHERE Id = @ClinicaId
        `)
    );

    return res.json({
      sucesso: true,
      mensagem: 'Política atualizada com sucesso'
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: 'Erro ao salvar política' });
  }
}

/**
 * Endereço público da clínica (/c/<slug>) para divulgar às clientes
 */
async function obterLinkPublico(req, res) {
  try {
    const result = await sql.connect().then(pool =>
      pool.request()
        .input('ClinicaId', sql.Int, req.clinicaId)
        .query('SELECT Slug FROM Clinica WHERE Id = @ClinicaId')
    );

    return res.json({ sucesso: true, slug: result.recordset[0]?.Slug || null });
  } catch (err) {
    console.error('Erro ao obter link público:', err);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro ao obter o link da clínica' });
  }
}

module.exports = {
  obterConfiguracoes,
  atualizarConfiguracoes,
  obterPolitica,
  atualizarPolitica,
  obterLinkPublico
};