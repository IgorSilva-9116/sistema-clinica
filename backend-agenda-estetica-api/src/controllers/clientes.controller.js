const { sql } = require('../config/database');

/**
 * =========================
 * LISTAR CLIENTES
 * =========================
 */
async function listarClientes(req, res) {
  try {
    const clinicaId = req.clinicaId;

    const result = await sql.connect().then(pool =>
      pool.request()
        .input('ClinicaId', sql.Int, clinicaId)
        .query(`
          SELECT
            c.Id        AS id,
            c.Nome      AS nome,
            c.Email     AS email,
            c.Telefone  AS telefone,
            c.Sexo      AS sexo,
            c.DataNascimento AS dataNascimento,
            c.Foto      AS foto,
            cc.Status   AS ativo
          FROM Cliente c
          INNER JOIN ClinicaCliente cc
            ON cc.ClienteId = c.Id
          WHERE cc.ClinicaId = @ClinicaId
        `)
    );

    return res.status(200).json({
      sucesso: true,
      clientes: result.recordset
    });

  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao listar clientes'
    });
  }
}

/**
 * =========================
 * CRIAR CLIENTE
 * =========================
 */
async function criarCliente(req, res) {
  try {
    const {
      nome,
      email,
      telefone,
      sexo,
      dataNascimento
    } = req.body;

    const clinicaId = req.clinicaId;

    if (!nome || !email) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Nome e email são obrigatórios'
      });
    }

    // ✅ PEGA FOTO (UPLOAD REAL OU FALLBACK)
    const foto = req.file
      ? req.file.filename
      : req.body.foto || null;

    // ✅ CRIA CLIENTE
    const clienteResult = await sql.connect().then(pool =>
      pool.request()
        .input('Nome', sql.VarChar(150), nome)
        .input('Email', sql.VarChar(150), email)
        .input('Telefone', sql.VarChar(20), telefone || null)
        .input('Sexo', sql.VarChar(20), sexo || null)
        .input('DataNascimento', sql.Date, dataNascimento || null)
        .input('Foto', sql.VarChar(255), foto)
        .query(`
          INSERT INTO Cliente (
            Nome,
            Email,
            Telefone,
            Sexo,
            DataNascimento,
            Foto
          )
          OUTPUT INSERTED.Id
          VALUES (
            @Nome,
            @Email,
            @Telefone,
            @Sexo,
            @DataNascimento,
            @Foto
          )
        `)
    );

    const clienteId = clienteResult.recordset[0].Id;

    // ✅ VÍNCULO COM CLÍNICA
    await sql.connect().then(pool =>
      pool.request()
        .input('ClinicaId', sql.Int, clinicaId)
        .input('ClienteId', sql.Int, clienteId)
        .query(`
          INSERT INTO ClinicaCliente (
            ClinicaId,
            ClienteId,
            Status
          )
          VALUES (
            @ClinicaId,
            @ClienteId,
            'Ativo'
          )
        `)
    );

    return res.status(201).json({
      sucesso: true,
      mensagem: 'Cliente criado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao criar cliente:', error);

    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao criar cliente'
    });
  }
}

/**
 * =========================
 * BUSCAR POR ID
 * =========================
 */
async function buscarPorId(req, res) {
  try {
    const clinicaId = req.clinicaId;
    const { id } = req.params;

    const pool = await sql.connect();

    const result = await pool.request()
      .input('Id', sql.Int, Number(id))
      .input('ClinicaId', sql.Int, clinicaId)
      .query(`
        SELECT
          c.Id        AS id,
          c.Nome      AS nome,
          c.Telefone  AS telefone,
          c.Email     AS email,
          c.Sexo      AS sexo,
          c.DataNascimento AS dataNascimento,
          c.Foto      AS foto,
          cc.Status   AS ativo
        FROM Cliente c
        INNER JOIN ClinicaCliente cc
          ON cc.ClienteId = c.Id
        WHERE c.Id = @Id
          AND cc.ClinicaId = @ClinicaId
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Cliente não encontrado'
      });
    }

    return res.status(200).json({
      sucesso: true,
      cliente: result.recordset[0]
    });

  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao buscar cliente'
    });
  }
}

/**
 * =========================
 * ATUALIZAR CLIENTE
 * =========================
 */
async function atualizarCliente(req, res) {
  try {
    const clinicaId = req.clinicaId;
    const { id } = req.params;

    const body = req.body || {};

    const nome = body.nome;
    const telefone = body.telefone;
    const email = body.email;
    const ativo = body.ativo;
    const sexo = body.sexo;
    const dataNascimento = body.dataNascimento;

    // ✅ AQUI ESTÁ A CORREÇÃO CRÍTICA
    const foto = req.file
      ? req.file.filename
      : body.foto || null;

    const pool = await sql.connect();

    await pool.request()
      .input('Id', sql.Int, Number(id))
      .input('Nome', sql.VarChar(150), nome)
      .input('Telefone', sql.VarChar(20), telefone)
      .input('Email', sql.VarChar(150), email)
      .input('Sexo', sql.VarChar(20), sexo || null)
      .input('DataNascimento', sql.Date, dataNascimento || null)
      .input('Foto', sql.VarChar(255), foto)
      .query(`
        UPDATE Cliente
        SET
          Nome = @Nome,
          Telefone = @Telefone,
          Email = @Email,
          Sexo = @Sexo,
          DataNascimento = @DataNascimento,
          Foto = @Foto
        WHERE Id = @Id
      `);

    await pool.request()
      .input('ClinicaId', sql.Int, clinicaId)
      .input('ClienteId', sql.Int, Number(id))
      .input('Status', sql.VarChar(10), ativo === 'Ativo' ? 'Ativo' : 'Inativo')
      .query(`
        UPDATE ClinicaCliente
        SET Status = @Status
        WHERE ClinicaId = @ClinicaId
          AND ClienteId = @ClienteId
      `);

    return res.status(200).json({
      sucesso: true,
      mensagem: 'Cliente atualizado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);

    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao atualizar cliente'
    });
  }
}

module.exports = {
  listarClientes,
  criarCliente,
  buscarPorId,
  atualizarCliente
};
