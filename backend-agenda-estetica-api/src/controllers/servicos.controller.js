const { sql } = require('../config/database');

/**
 * =========================
 * LISTAR SERVIÇOS ATIVOS
 * =========================
 * Acessível por:
 * - clínica
 * - profissional
 * - cliente
 */
async function listarServicos(req, res) {
  try {
    const clinicaId = req.clinicaId;

    const result = await sql.connect().then(pool =>
      pool.request()
        .input('ClinicaId', sql.Int, clinicaId)
        .query(`
          SELECT
            Id              AS id,
            Titulo          AS titulo,
            Descricao       AS descricao,
            Preco           AS preco,
            DuracaoMinutos  AS duracaoMinutos
          FROM Servico
          WHERE ClinicaId = @ClinicaId
            AND Status = 'Ativo'
        `)
    );

    // ✅ Evita 304 / cache indevido
    res.set('Cache-Control', 'no-store');

    return res.status(200).json({
      sucesso: true,
      servicos: result.recordset
    });

  } catch (error) {
    console.error('Erro ao listar serviços:', error);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao listar serviços'
    });
  }
}

/**
 * =========================
 * LISTAR TODOS OS SERVIÇOS (ADMIN)
 * =========================
 * Somente clínica
 */
async function listarServicosAdmin(req, res) {
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
            s.Id AS id,
            s.Titulo AS titulo,
            s.Descricao AS descricao,
            s.Preco AS preco,
            s.DuracaoMinutos AS duracaoMinutos,
            s.Status AS status,
            s.DataCadastro AS dataCadastro,
            cs.Id AS categoriaServicoId,
            cs.Nome AS categoria
          FROM Servico s
          LEFT JOIN CategoriaServico cs
            ON cs.Id = s.CategoriaServicoId
          WHERE s.ClinicaId = @ClinicaId
        `)
    );

    // ✅ Evita 304 / cache indevido
    res.set('Cache-Control', 'no-store');

    return res.status(200).json({
      sucesso: true,
      servicos: result.recordset
    });

  } catch (error) {
    console.error('Erro ao listar serviços (admin):', error);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao listar serviços'
    });
  }
}

/**
 * =========================
 * CRIAR SERVIÇO
 * =========================
 * Somente clínica
 */
async function criarServico(req, res) {
  try {
    if (req.userTipo !== 'clinica') {
      return res.status(403).json({
        sucesso: false,
        mensagem: 'Apenas clínicas podem criar serviços'
      });
    }

    const { titulo, descricao, preco, duracaoMinutos, categoriaServicoId } = req.body;
    const clinicaId = req.clinicaId;

    if (!titulo || !preco || !duracaoMinutos) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Título, preço e duração são obrigatórios'
      });
    }

    await sql.connect().then(pool =>
      pool.request()
        .input('ClinicaId', sql.Int, clinicaId)
        .input('Titulo', sql.VarChar(150), titulo)
        .input('Descricao', sql.VarChar(255), descricao || null)
        .input('Preco', sql.Decimal(10, 2), preco)
        .input('DuracaoMinutos', sql.Int, duracaoMinutos)
        .input('CategoriaServicoId', sql.Int, categoriaServicoId || null)
        .input('Status', sql.VarChar(20), 'Ativo')
        .query(`
          INSERT INTO Servico
          (
            ClinicaId,
            Titulo,
            Descricao,
            Preco,
            DuracaoMinutos,
            CategoriaServicoId,
            Status,
            DataCadastro
          )
          VALUES
          (
            @ClinicaId,
            @Titulo,
            @Descricao,
            @Preco,
            @DuracaoMinutos,
            @CategoriaServicoId,
            @Status,
            GETDATE()
          )
        `)
    );

    return res.status(201).json({
      sucesso: true,
      mensagem: 'Serviço criado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao criar serviço:', error);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno ao criar serviço'
    });
  }
}

/**
 * =========================
 * EDITAR SERVIÇO
 * =========================
 * Somente clínica
 */
async function atualizarServico(req, res) {
  try {
    if (req.userTipo !== 'clinica') {
      return res.status(403).json({
        sucesso: false,
        mensagem: 'Apenas clínicas podem editar serviços'
      });
    }

    const { id } = req.params;
    const { titulo, descricao, preco, duracaoMinutos, categoriaServicoId } = req.body;
    const clinicaId = req.clinicaId;

    await sql.connect().then(pool =>
      pool.request()
        .input('Id', sql.Int, id)
        .input('ClinicaId', sql.Int, clinicaId)
        .input('Titulo', sql.VarChar(150), titulo)
        .input('Descricao', sql.VarChar(255), descricao || null)
        .input('Preco', sql.Decimal(10, 2), preco)
        .input('DuracaoMinutos', sql.Int, duracaoMinutos)
        .input('CategoriaServicoId', sql.Int, categoriaServicoId || null)
        .query(`
          UPDATE Servico
          SET
            Titulo = ISNULL(@Titulo, Titulo),
            Descricao = ISNULL(@Descricao, Descricao),
            Preco = ISNULL(@Preco, Preco),
            DuracaoMinutos = ISNULL(@DuracaoMinutos, DuracaoMinutos),
            CategoriaServicoId = ISNULL(@CategoriaServicoId, CategoriaServicoId)
          WHERE Id = @Id
            AND ClinicaId = @ClinicaId
        `)
    );

    return res.status(200).json({
      sucesso: true,
      mensagem: 'Serviço atualizado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar serviço:', error);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno ao atualizar serviço'
    });
  }
}

/**
 * =========================
 * ATIVAR / DESATIVAR SERVIÇO
 * =========================
 */
async function ativarServico(req, res) {
  const { id } = req.params;
  const clinicaId = req.clinicaId;

  await sql.connect().then(pool =>
    pool.request()
      .input('Id', sql.Int, id)
      .input('ClinicaId', sql.Int, clinicaId)
      .query(`
        UPDATE Servico
        SET Status = 'Ativo'
        WHERE Id = @Id AND ClinicaId = @ClinicaId
      `)
  );

  return res.status(200).json({ sucesso: true });
}

async function desativarServico(req, res) {
  const { id } = req.params;
  const clinicaId = req.clinicaId;

  await sql.connect().then(pool =>
    pool.request()
      .input('Id', sql.Int, id)
      .input('ClinicaId', sql.Int, clinicaId)
      .query(`
        UPDATE Servico
        SET Status = 'Inativo'
        WHERE Id = @Id AND ClinicaId = @ClinicaId
      `)
  );

  return res.status(200).json({ sucesso: true });
}

module.exports = {
  listarServicos,
  listarServicosAdmin,
  criarServico,
  atualizarServico,
  ativarServico,
  desativarServico
};

