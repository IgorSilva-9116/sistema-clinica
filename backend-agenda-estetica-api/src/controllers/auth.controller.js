const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { sql } = require('../config/database');

/**
 * LOGIN DA CLÍNICA
 */
async function loginClinica(req, res) {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Email e senha são obrigatórios'
      });
    }

    const result = await sql.connect().then(pool => {
      return pool
        .request()
        .input('Email', sql.VarChar(150), email)
        .input('Senha', sql.VarChar(255), senha)
        .execute('sp_LoginClinica');
    });

    if (result.recordset.length === 0) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Credenciais inválidas'
      });
    }

    const clinica = result.recordset[0];

    const token = jwt.sign(
      {
        id: clinica.Id,
        tipo: 'clinica'
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN
      }
    );

    return res.status(200).json({
      sucesso: true,
      token,
      clinica
    });

  } catch (error) {
    console.error('Erro no login da clínica:', error);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno no servidor'
    });
  }
}

/**
 * LOGIN DO CLIENTE
 */
async function loginCliente(req, res) {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Email e senha são obrigatórios'
      });
    }

    const result = await sql.connect().then(pool => {
      return pool
        .request()
        .input('Email', sql.VarChar(150), email)
        .input('Senha', sql.VarChar(255), senha)
        .execute('sp_LoginCliente');
    });

    if (result.recordset.length === 0) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Credenciais inválidas'
      });
    }

    const cliente = result.recordset[0];

    const token = jwt.sign(
      {
        id: cliente.Id,
        tipo: 'cliente'
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN
      }
    );

    return res.status(200).json({
      sucesso: true,
      token,
      cliente
    });

  } catch (error) {
    console.error('Erro no login do cliente:', error);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno no servidor'
    });
  }
}

// ===============================
// LOGIN ÚNICO
// ===============================
async function loginUnico(req, res) {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Email e senha são obrigatórios'
      });
    }

    const result = await sql.connect().then(pool =>
      pool.request()
        .input('Email', sql.VarChar(150), email)
     .query(`
      SELECT
       Id,
       Email,
       SenhaHash,
       Role,
       UserTipo,
       ClinicaId,
       ProfissionalId,
       ClienteId,
        PrecisaTrocarSenha AS precisaTrocarSenha
      FROM Usuario
      WHERE Email = @Email
      AND Ativo = 1
     `)


    );

    if (result.recordset.length === 0) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Credenciais inválidas'
      });
    }

    const usuario = result.recordset[0];

    const senhaValida = await bcrypt.compare(senha, usuario.SenhaHash);
    if (!senhaValida) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Credenciais inválidas'
      });
    }

    const token = jwt.sign(
      {
        userId: usuario.Id,
        userTipo: usuario.UserTipo,
        role: usuario.Role,
        clinicaId: usuario.ClinicaId,
        profissionalId: usuario.ProfissionalId,
        clienteId: usuario.ClienteId,
        precisaTrocarSenha: Boolean(usuario.precisaTrocarSenha)

      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    return res.status(200).json({
      sucesso: true,
      token,
      usuario: {
        id: usuario.Id,
        email: usuario.Email,
        userTipo: usuario.UserTipo,
        role: usuario.Role,
        clinicaId: usuario.ClinicaId,
        profissionalId: usuario.ProfissionalId,
        clienteId: usuario.ClienteId,
        precisaTrocarSenha: Boolean(usuario.precisaTrocarSenha)

      }
    });

  } catch (error) {
    console.error('Erro no login único:', error);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno no servidor'
    });
  }
}

module.exports = {
  loginClinica,
  loginCliente,
  loginUnico
};