const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { sql } = require('../config/database');
const { normalizarTelefone } = require('../utils/telefone');

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
            c.Observacao AS observacao,
            cc.Status   AS ativo,
            CASE
              WHEN u.Id IS NULL THEN NULL
              WHEN u.PrecisaTrocarSenha = 1 THEN 'CONVIDADA'
              ELSE 'ATIVO'
            END AS acessoApp
                      FROM Cliente c
          INNER JOIN ClinicaCliente cc
            ON cc.ClienteId = c.Id
          LEFT JOIN Usuario u
            ON u.ClienteId = c.Id
           AND u.ClinicaId = cc.ClinicaId
           AND u.UserTipo = 'cliente'
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
      telefone,
      sexo,
      dataNascimento,
      observacao
    } = req.body;

    // E-mail é opcional: clientes sem e-mail entram no app pelo celular
    const email = String(req.body.email || '').trim().toLowerCase() || null;

    const clinicaId = req.clinicaId;

    if (!nome || !telefone) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Nome e telefone são obrigatórios'
      });
    }

    if (email) {
      const clienteExistente = await sql.connect().then(pool =>
        pool.request()
          .input('Email', sql.VarChar(150), email)
          .query(`
        SELECT Id
        FROM Cliente
        WHERE Email = @Email
      `)
      );

      if (clienteExistente.recordset.length > 0) {
        return res.status(409).json({
          sucesso: false,
          mensagem: 'Email já cadastrado'
        });
      }
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
        .input('Observacao', sql.VarChar(1000), observacao || null)
        .query(`
          INSERT INTO Cliente (
            Nome,
            Email,
            Telefone,
            Sexo,
            DataNascimento,
            Observacao,
            Foto
          )
          OUTPUT INSERTED.Id
          VALUES (
            @Nome,
            @Email,
            @Telefone,
            @Sexo,
            @DataNascimento,
            @Observacao,
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
          c.Id AS id,
          c.Nome AS nome,
          c.Telefone AS telefone,
          c.Email AS email,
          c.Sexo AS sexo,
          c.DataNascimento AS dataNascimento,
          c.Foto AS foto,
          c.Observacao AS observacao,
          cc.Status AS ativo
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
    const email = String(body.email || '').trim().toLowerCase() || null;
    const ativo = body.ativo;
    const sexo = body.sexo;
    const dataNascimento = body.dataNascimento;
    const observacao = body.observacao;

    // ✅ AQUI ESTÁ A CORREÇÃO CRÍTICA
    const foto = req.file
      ? req.file.filename
      : body.foto || null;

    const pool = await sql.connect();

    // Só edita clientes vinculadas a esta clínica
    const vinculo = await pool.request()
      .input('ClinicaId', sql.Int, clinicaId)
      .input('ClienteId', sql.Int, Number(id))
      .query(`SELECT Id FROM ClinicaCliente WHERE ClinicaId = @ClinicaId AND ClienteId = @ClienteId`);

    if (vinculo.recordset.length === 0) {
      return res.status(404).json({ sucesso: false, mensagem: 'Cliente não encontrado' });
    }

    // Login do app da cliente acompanha o e-mail e o celular da ficha
    const usuarioApp = await pool.request()
      .input('ClienteId', sql.Int, Number(id))
      .input('Email', sql.VarChar(150), email)
      .input('Telefone', sql.VarChar(20), normalizarTelefone(telefone))
      .query(`
        SELECT
          (SELECT Id FROM Usuario WHERE ClienteId = @ClienteId AND UserTipo = 'cliente') AS UsuarioId,
          (SELECT COUNT(*) FROM Usuario
            WHERE (Email = @Email OR Telefone = @Telefone)
              AND (ClienteId IS NULL OR ClienteId <> @ClienteId)) AS Conflitos
      `);

    const { UsuarioId, Conflitos } = usuarioApp.recordset[0];

    if (UsuarioId && Conflitos > 0) {
      return res.status(409).json({
        sucesso: false,
        mensagem: 'Este e-mail ou celular já é usado no login de outra pessoa'
      });
    }

    if (UsuarioId) {
      await pool.request()
        .input('Id', sql.Int, UsuarioId)
        .input('Nome', sql.NVarChar(150), nome)
        .input('Email', sql.VarChar(150), email)
        .input('Telefone', sql.VarChar(20), normalizarTelefone(telefone))
        .query(`UPDATE Usuario SET Nome = @Nome, Email = @Email, Telefone = @Telefone WHERE Id = @Id`);
    }

    await pool.request()
      .input('Id', sql.Int, Number(id))
      .input('Nome', sql.VarChar(150), nome)
      .input('Telefone', sql.VarChar(20), telefone)
      .input('Email', sql.VarChar(150), email)
      .input('Sexo', sql.VarChar(20), sexo || null)
      .input('DataNascimento', sql.Date, dataNascimento || null)
      .input('Foto', sql.VarChar(255), foto)
      .input('Observacao', sql.VarChar(1000), observacao || null)
      .query(`
        UPDATE Cliente
        SET
          Nome = @Nome,
          Telefone = @Telefone,
          Email = @Email,
          Sexo = @Sexo,
          DataNascimento = @DataNascimento,
          Foto = @Foto,
          Observacao = @Observacao 
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

async function listarAniversariantes(req, res) {
  try {
    const clinicaId = req.clinicaId;

    const pool = await sql.connect();

    const result = await pool.request()
      .input('ClinicaId', sql.Int, clinicaId)
      .query(`
        SELECT
          c.Id AS id,
          c.Nome AS nome,
          c.Telefone AS telefone,
          c.DataNascimento AS dataNascimento
        FROM Cliente c
        INNER JOIN ClinicaCliente cc
          ON cc.ClienteId = c.Id
        WHERE
          cc.ClinicaId = @ClinicaId
          AND MONTH(c.DataNascimento) = MONTH(GETDATE())
        ORDER BY DAY(c.DataNascimento)
      `);

    return res.json({
      sucesso: true,
      aniversariantes: result.recordset
    });

  } catch (error) {
    console.error('Erro ao listar aniversariantes:', error);

    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao listar aniversariantes'
    });
  }
}

/**
 * =========================
 * CONVITE PARA O APP DA CLIENTE
 * =========================
 * Gera um link (válido por 7 dias) para a cliente criar a senha.
 * A clínica envia pelo WhatsApp — pensado para clientes que não
 * conseguem se cadastrar sozinhas.
 */
async function gerarConvite(req, res) {
  try {
    const clienteId = Number(req.params.id);
    const clinicaId = req.clinicaId;
    const pool = await sql.connect();

    const clienteResult = await pool.request()
      .input('ClienteId', sql.Int, clienteId)
      .input('ClinicaId', sql.Int, clinicaId)
      .query(`
        SELECT c.Nome, c.Email, c.Telefone, cl.Nome AS ClinicaNome
        FROM Cliente c
        INNER JOIN ClinicaCliente cc
          ON cc.ClienteId = c.Id
         AND cc.ClinicaId = @ClinicaId
         AND cc.Status = 'Ativo'
        INNER JOIN Clinica cl ON cl.Id = cc.ClinicaId
        WHERE c.Id = @ClienteId
      `);

    if (clienteResult.recordset.length === 0) {
      return res.status(404).json({ sucesso: false, mensagem: 'Cliente não encontrada ou inativa' });
    }

    const cliente = clienteResult.recordset[0];

    // A cliente entra pelo celular (ou pelo e-mail, se tiver)
    const telefoneLogin = normalizarTelefone(cliente.Telefone);

    if (!telefoneLogin && !cliente.Email) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Cadastre um celular válido (com DDD) para a cliente antes de gerar o acesso'
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiraEm = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const usuarioResult = await pool.request()
      .input('ClienteId', sql.Int, clienteId)
      .input('ClinicaId', sql.Int, clinicaId)
      .query(`
        SELECT Id, Ativo
        FROM Usuario
        WHERE ClienteId = @ClienteId
          AND ClinicaId = @ClinicaId
          AND UserTipo = 'cliente'
      `);

    const usuario = usuarioResult.recordset[0];

    if (usuario && !usuario.Ativo) {
      return res.status(409).json({ sucesso: false, mensagem: 'O acesso desta cliente está desativado' });
    }

    if (usuario) {
      // Já tem acesso: o novo link serve para ela criar uma nova senha
      await pool.request()
        .input('Id', sql.Int, usuario.Id)
        .input('Token', sql.NVarChar(255), token)
        .input('ExpiraEm', sql.DateTime, expiraEm)
        .query(`
          UPDATE Usuario
          SET ResetToken = @Token, ResetTokenExpiraEm = @ExpiraEm
          WHERE Id = @Id
        `);
    } else {
      const loginEmUso = await pool.request()
        .input('Email', sql.VarChar(150), cliente.Email)
        .input('Telefone', sql.VarChar(20), telefoneLogin)
        .query(`SELECT Id FROM Usuario WHERE Email = @Email OR Telefone = @Telefone`);

      if (loginEmUso.recordset.length > 0) {
        return res.status(409).json({
          sucesso: false,
          mensagem: 'Este celular ou e-mail já é usado no login de outra pessoa'
        });
      }

      // Senha aleatória que ninguém conhece: só o link do convite libera o acesso
      const senhaHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);

      await pool.request()
        .input('Nome', sql.NVarChar(150), cliente.Nome)
        .input('Email', sql.VarChar(150), cliente.Email)
        .input('Telefone', sql.VarChar(20), telefoneLogin)
        .input('SenhaHash', sql.VarChar(255), senhaHash)
        .input('ClinicaId', sql.Int, clinicaId)
        .input('ClienteId', sql.Int, clienteId)
        .input('Token', sql.NVarChar(255), token)
        .input('ExpiraEm', sql.DateTime, expiraEm)
        .query(`
          INSERT INTO Usuario
            (Nome, Email, Telefone, SenhaHash, UserTipo, ClinicaId, ClienteId, Ativo, DataCadastro,
             PrecisaTrocarSenha, ResetToken, ResetTokenExpiraEm)
          VALUES
            (@Nome, @Email, @Telefone, @SenhaHash, 'cliente', @ClinicaId, @ClienteId, 1, GETDATE(),
             1, @Token, @ExpiraEm)
        `);
    }

    const link = `${process.env.APP_URL}/cliente/ativar?token=${token}`;
    const primeiroNome = cliente.Nome.split(' ')[0];

    return res.json({
      sucesso: true,
      link,
      telefone: cliente.Telefone,
      mensagem:
        `Olá, ${primeiroNome}! Agora você pode agendar seus horários na ${cliente.ClinicaNome} pelo celular. ` +
        `Toque no link para criar sua senha: ${link} ` +
        `Depois, para entrar, use o seu ${telefoneLogin ? 'número de celular' : 'e-mail'} e a senha que você criar.`
    });

  } catch (error) {
    console.error('Erro ao gerar convite:', error);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro ao gerar o acesso da cliente' });
  }
}

module.exports = {
  listarClientes,
  criarCliente,
  buscarPorId,
  atualizarCliente,
  listarAniversariantes,
  gerarConvite
};
