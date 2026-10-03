const bcrypt = require('bcrypt');
const { sql } = require('../config/database');
const { gerarSessaoUsuario } = require('../utils/tokenUsuario');
const { senhaClienteValida, MENSAGEM_SENHA_CLIENTE } = require('../utils/senhaCliente');
const { normalizarTelefone, sqlTelefoneSemFormatacao } = require('../utils/telefone');

/**
 * Busca a clínica ativa pelo endereço público (/c/<slug>)
 */
async function buscarClinicaPorSlug(pool, slug) {
  const result = await pool.request()
    .input('Slug', sql.VarChar(80), slug)
    .query(`
      SELECT Id, Nome, Telefone, PoliticaAgendamento, Slug
      FROM Clinica
      WHERE Slug = @Slug
        AND Status = 'Ativa'
    `);

  return result.recordset[0] || null;
}

/**
 * =========================
 * PÁGINA PÚBLICA DA CLÍNICA
 * =========================
 */
async function obterClinicaPublica(req, res) {
  try {
    const pool = await sql.connect();
    const clinica = await buscarClinicaPorSlug(pool, req.params.slug);

    if (!clinica) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Clínica não encontrada'
      });
    }

    const servicos = await pool.request()
      .input('ClinicaId', sql.Int, clinica.Id)
      .query(`
        SELECT
          s.Id AS id,
          s.Titulo AS titulo,
          s.Descricao AS descricao,
          s.Preco AS preco,
          s.DuracaoMinutos AS duracaoMinutos,
          cs.Nome AS categoria
        FROM Servico s
        LEFT JOIN CategoriaServico cs
          ON cs.Id = s.CategoriaServicoId
        WHERE s.ClinicaId = @ClinicaId
          AND s.Status = 'Ativo'
        ORDER BY cs.Nome, s.Titulo
      `);

    return res.json({
      sucesso: true,
      clinica: {
        nome: clinica.Nome,
        telefone: clinica.Telefone,
        slug: clinica.Slug,
        politicaAgendamento: clinica.PoliticaAgendamento
      },
      servicos: servicos.recordset
    });

  } catch (error) {
    console.error('Erro ao obter clínica pública:', error);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao carregar a clínica'
    });
  }
}

/**
 * =========================
 * CADASTRO DA CLIENTE (pelo link da clínica)
 * =========================
 * Celular e data de nascimento obrigatórios (login e mensagens de
 * aniversário). E-mail é opcional: quem não tem entra pelo celular.
 */
async function cadastrarCliente(req, res) {
  const { nome, telefone, dataNascimento, senha } = req.body;
  const email = String(req.body.email || '').trim().toLowerCase() || null;
  const telefoneNormalizado = normalizarTelefone(telefone);

  if (!nome || !telefone || !dataNascimento || !senha) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'Nome, celular, data de nascimento e senha são obrigatórios'
    });
  }

  if (!telefoneNormalizado) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'Celular inválido. Informe com DDD, ex.: (32) 98888-7777'
    });
  }

  if (!senhaClienteValida(senha)) {
    return res.status(400).json({
      sucesso: false,
      mensagem: MENSAGEM_SENHA_CLIENTE
    });
  }

  try {
    const pool = await sql.connect();
    const clinica = await buscarClinicaPorSlug(pool, req.params.slug);

    if (!clinica) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Clínica não encontrada'
      });
    }

    const usuarioExistente = await pool.request()
      .input('Email', sql.VarChar(150), email)
      .input('Telefone', sql.VarChar(20), telefoneNormalizado)
      .query(`SELECT Id FROM Usuario WHERE Email = @Email OR Telefone = @Telefone`);

    if (usuarioExistente.recordset.length > 0) {
      return res.status(409).json({
        sucesso: false,
        codigo: 'JA_TEM_CONTA',
        mensagem: 'Este celular ou e-mail já tem uma conta. Faça login.'
      });
    }

    // Ficha já cadastrada pela clínica: por segurança a conta só é
    // liberada pelo convite, senão qualquer um que soubesse o e-mail
    // ou o celular poderia "assumir" a ficha e ver os agendamentos dela.
    const clienteExistente = await pool.request()
      .input('Email', sql.VarChar(150), email)
      .input('Telefone', sql.VarChar(20), telefoneNormalizado)
      .input('ClinicaId', sql.Int, clinica.Id)
      .query(`
        SELECT c.Id
        FROM Cliente c
        LEFT JOIN ClinicaCliente cc
          ON cc.ClienteId = c.Id
         AND cc.ClinicaId = @ClinicaId
        WHERE c.Email = @Email
           OR (cc.Id IS NOT NULL
               AND ${sqlTelefoneSemFormatacao('c.Telefone')} IN (@Telefone, '55' + @Telefone))
      `);

    if (clienteExistente.recordset.length > 0) {
      return res.status(409).json({
        sucesso: false,
        codigo: 'JA_E_CLIENTE',
        mensagem: 'Você já tem cadastro na clínica. Peça seu link de acesso pelo WhatsApp.',
        telefoneClinica: clinica.Telefone
      });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const cliente = await new sql.Request(transaction)
        .input('Nome', sql.VarChar(150), nome.trim())
        .input('Email', sql.VarChar(150), email)
        .input('Telefone', sql.VarChar(20), telefoneNormalizado)
        .input('DataNascimento', sql.Date, dataNascimento)
        .query(`
          INSERT INTO Cliente (Nome, Email, Telefone, DataNascimento)
          OUTPUT INSERTED.Id
          VALUES (@Nome, @Email, @Telefone, @DataNascimento)
        `);

      const clienteId = cliente.recordset[0].Id;

      await new sql.Request(transaction)
        .input('ClinicaId', sql.Int, clinica.Id)
        .input('ClienteId', sql.Int, clienteId)
        .query(`
          INSERT INTO ClinicaCliente (ClinicaId, ClienteId, Status)
          VALUES (@ClinicaId, @ClienteId, 'Ativo')
        `);

      const usuario = await new sql.Request(transaction)
        .input('Nome', sql.NVarChar(150), nome.trim())
        .input('Email', sql.VarChar(150), email)
        .input('Telefone', sql.VarChar(20), telefoneNormalizado)
        .input('SenhaHash', sql.VarChar(255), senhaHash)
        .input('ClinicaId', sql.Int, clinica.Id)
        .input('ClienteId', sql.Int, clienteId)
        .query(`
          INSERT INTO Usuario
            (Nome, Email, Telefone, SenhaHash, UserTipo, ClinicaId, ClienteId, Ativo, DataCadastro, PrecisaTrocarSenha)
          OUTPUT INSERTED.*
          VALUES
            (@Nome, @Email, @Telefone, @SenhaHash, 'cliente', @ClinicaId, @ClienteId, 1, GETDATE(), 0)
        `);

      await transaction.commit();

      return res.status(201).json({
        sucesso: true,
        ...gerarSessaoUsuario(usuario.recordset[0])
      });

    } catch (erroTransacao) {
      await transaction.rollback();
      throw erroTransacao;
    }

  } catch (error) {
    console.error('Erro no cadastro da cliente:', error);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao criar sua conta'
    });
  }
}

/**
 * Busca o usuário-cliente dono de um convite ainda válido
 */
async function buscarConviteValido(pool, token) {
  const result = await pool.request()
    .input('Token', sql.NVarChar(255), token)
    .query(`
      SELECT
        u.Id, u.Nome, u.Email, u.Telefone, u.ClienteId,
        c.Nome AS ClinicaNome, c.Slug,
        cli.DataNascimento
      FROM Usuario u
      INNER JOIN Clinica c ON c.Id = u.ClinicaId
      INNER JOIN Cliente cli ON cli.Id = u.ClienteId
      WHERE u.ResetToken = @Token
        AND u.ResetTokenExpiraEm > GETDATE()
        AND u.UserTipo = 'cliente'
        AND u.Ativo = 1
    `);

  return result.recordset[0] || null;
}

/**
 * =========================
 * CONVITE: dados para a tela "Crie sua senha"
 * =========================
 */
async function obterConvite(req, res) {
  try {
    const pool = await sql.connect();
    const convite = await buscarConviteValido(pool, req.params.token);

    if (!convite) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Este link expirou ou já foi usado. Peça um novo para a clínica.'
      });
    }

    return res.json({
      sucesso: true,
      nome: convite.Nome,
      email: convite.Email,
      telefone: convite.Telefone,
      clinica: convite.ClinicaNome,
      // Sem aniversário na ficha: pede na hora de criar a senha
      precisaDataNascimento: !convite.DataNascimento
    });

  } catch (error) {
    console.error('Erro ao obter convite:', error);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro ao validar o link' });
  }
}

/**
 * =========================
 * CONVITE: cliente cria a senha e já entra
 * =========================
 */
async function ativarConvite(req, res) {
  const { token, senha, dataNascimento } = req.body;

  if (!token || !senha) {
    return res.status(400).json({ sucesso: false, mensagem: 'Link e senha são obrigatórios' });
  }

  if (!senhaClienteValida(senha)) {
    return res.status(400).json({ sucesso: false, mensagem: MENSAGEM_SENHA_CLIENTE });
  }

  try {
    const pool = await sql.connect();
    const convite = await buscarConviteValido(pool, token);

    if (!convite) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Este link expirou ou já foi usado. Peça um novo para a clínica.'
      });
    }

    if (!convite.DataNascimento && !dataNascimento) {
      return res.status(400).json({ sucesso: false, mensagem: 'Informe sua data de nascimento' });
    }

    if (!convite.DataNascimento) {
      await pool.request()
        .input('ClienteId', sql.Int, convite.ClienteId)
        .input('DataNascimento', sql.Date, dataNascimento)
        .query(`UPDATE Cliente SET DataNascimento = @DataNascimento WHERE Id = @ClienteId`);
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const usuario = await pool.request()
      .input('Id', sql.Int, convite.Id)
      .input('SenhaHash', sql.VarChar(255), senhaHash)
      .query(`
        UPDATE Usuario
        SET SenhaHash = @SenhaHash,
            ResetToken = NULL,
            ResetTokenExpiraEm = NULL,
            PrecisaTrocarSenha = 0
        OUTPUT INSERTED.*
        WHERE Id = @Id
      `);

    return res.json({
      sucesso: true,
      slug: convite.Slug,
      ...gerarSessaoUsuario(usuario.recordset[0])
    });

  } catch (error) {
    console.error('Erro ao ativar convite:', error);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro ao criar sua senha' });
  }
}

module.exports = {
  obterClinicaPublica,
  cadastrarCliente,
  obterConvite,
  ativarConvite
};
