const bcrypt = require('bcrypt');
const { sql } = require('../config/database');
const { senhaClienteValida, MENSAGEM_SENHA_CLIENTE } = require('../utils/senhaCliente');
const { normalizarTelefone } = require('../utils/telefone');

/**
 * Todas as funções usam SEMPRE o clienteId/clinicaId do token,
 * nunca um id vindo da requisição: a cliente só enxerga os próprios dados.
 */

/**
 * =========================
 * MEU PERFIL
 * =========================
 */
async function obterPerfil(req, res) {
  try {
    const result = await sql.connect().then(pool =>
      pool.request()
        .input('ClienteId', sql.Int, req.clienteId)
        .input('ClinicaId', sql.Int, req.clinicaId)
        .query(`
          SELECT
            c.Nome AS nome,
            c.Email AS email,
            c.Telefone AS telefone,
            c.Sexo AS sexo,
            c.DataNascimento AS dataNascimento,
            cl.Nome AS clinicaNome,
            cl.Slug AS clinicaSlug,
            cl.Telefone AS clinicaTelefone
          FROM Cliente c
          INNER JOIN ClinicaCliente cc
            ON cc.ClienteId = c.Id
           AND cc.ClinicaId = @ClinicaId
          INNER JOIN Clinica cl
            ON cl.Id = cc.ClinicaId
          WHERE c.Id = @ClienteId
        `)
    );

    if (result.recordset.length === 0) {
      return res.status(404).json({ sucesso: false, mensagem: 'Cadastro não encontrado' });
    }

    res.set('Cache-Control', 'no-store');
    return res.json({ sucesso: true, perfil: result.recordset[0] });

  } catch (error) {
    console.error('Erro ao obter perfil da cliente:', error);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro ao carregar seu perfil' });
  }
}

async function atualizarPerfil(req, res) {
  const { nome, telefone, sexo, dataNascimento } = req.body;

  if (!nome || !telefone || !dataNascimento) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'Nome, celular e data de nascimento são obrigatórios'
    });
  }

  const telefoneNormalizado = normalizarTelefone(telefone);

  if (!telefoneNormalizado) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'Celular inválido. Informe com DDD, ex.: (32) 98888-7777'
    });
  }

  try {
    const pool = await sql.connect();

    // O celular também é o login: não pode ser de outra pessoa
    const emUso = await pool.request()
      .input('Telefone', sql.VarChar(20), telefoneNormalizado)
      .input('Id', sql.Int, req.userId)
      .query(`SELECT Id FROM Usuario WHERE Telefone = @Telefone AND Id <> @Id`);

    if (emUso.recordset.length > 0) {
      return res.status(409).json({
        sucesso: false,
        mensagem: 'Este celular já é usado em outra conta'
      });
    }

    await pool.request()
      .input('ClienteId', sql.Int, req.clienteId)
      .input('Nome', sql.VarChar(150), nome.trim())
      .input('Telefone', sql.VarChar(20), telefoneNormalizado)
      .input('Sexo', sql.VarChar(20), sexo || null)
      .input('DataNascimento', sql.Date, dataNascimento)
      .query(`
        UPDATE Cliente
        SET Nome = @Nome,
            Telefone = @Telefone,
            Sexo = @Sexo,
            DataNascimento = @DataNascimento
        WHERE Id = @ClienteId
      `);

    await pool.request()
      .input('Id', sql.Int, req.userId)
      .input('Nome', sql.NVarChar(150), nome.trim())
      .input('Telefone', sql.VarChar(20), telefoneNormalizado)
      .query(`UPDATE Usuario SET Nome = @Nome, Telefone = @Telefone WHERE Id = @Id`);

    return res.json({ sucesso: true, mensagem: 'Dados atualizados' });

  } catch (error) {
    console.error('Erro ao atualizar perfil da cliente:', error);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro ao salvar seus dados' });
  }
}

/**
 * =========================
 * TROCAR SENHA
 * =========================
 */
async function alterarSenha(req, res) {
  const { senhaAtual, novaSenha } = req.body;

  if (!senhaAtual || !novaSenha) {
    return res.status(400).json({ sucesso: false, mensagem: 'Informe a senha atual e a nova senha' });
  }

  if (!senhaClienteValida(novaSenha)) {
    return res.status(400).json({ sucesso: false, mensagem: MENSAGEM_SENHA_CLIENTE });
  }

  try {
    const pool = await sql.connect();

    const result = await pool.request()
      .input('Id', sql.Int, req.userId)
      .query(`SELECT SenhaHash FROM Usuario WHERE Id = @Id`);

    const senhaConfere = result.recordset.length > 0 &&
      await bcrypt.compare(senhaAtual, result.recordset[0].SenhaHash);

    if (!senhaConfere) {
      return res.status(400).json({ sucesso: false, mensagem: 'Senha atual incorreta' });
    }

    const senhaHash = await bcrypt.hash(novaSenha, 10);

    await pool.request()
      .input('Id', sql.Int, req.userId)
      .input('SenhaHash', sql.VarChar(255), senhaHash)
      .query(`UPDATE Usuario SET SenhaHash = @SenhaHash, PrecisaTrocarSenha = 0 WHERE Id = @Id`);

    return res.json({ sucesso: true, mensagem: 'Senha alterada com sucesso' });

  } catch (error) {
    console.error('Erro ao alterar senha da cliente:', error);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro ao alterar a senha' });
  }
}

module.exports = {
  obterPerfil,
  atualizarPerfil,
  alterarSenha
};
