const { sql } = require('../config/database');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { enviarEmail } = require('../services/email.service');

/**
 * ============================
 * VALIDAR SENHA FORTE
 * ============================
 */
function senhaForte(senha) {
  return (
    senha.length >= 8 &&
    /[A-Z]/.test(senha) &&
    /[a-z]/.test(senha) &&
    /\d/.test(senha) &&
    /[^A-Za-z0-9]/.test(senha)
  );
}

/**
 * ============================
 * ESQUECEU A SENHA
 * ============================
 */
async function esqueceuSenha(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        mensagem: 'Email é obrigatório'
      });
    }

    const result = await sql.connect().then(pool =>
      pool.request()
        .input('Email', sql.VarChar(150), email)
        .query(`
          SELECT Id
          FROM Usuario
          WHERE Email = @Email
            AND Ativo = 1
        `)
    );

    // ⚠️ Não revela se o email existe
    if (result.recordset.length === 0) {
      return res.json({
        mensagem: 'Se o email existir, enviaremos instruções'
      });
    }

    const usuarioId = result.recordset[0].Id;

    const token = crypto.randomBytes(32).toString('hex');
    const expiraEm = new Date(Date.now() + 30 * 60 * 1000); // 30 min

    await sql.connect().then(pool =>
      pool.request()
        .input('Id', sql.Int, usuarioId)
        .input('ResetToken', sql.VarChar(255), token)
        .input('ResetTokenExpiraEm', sql.DateTime, expiraEm)
        .query(`
          UPDATE Usuario
          SET ResetToken = @ResetToken,
              ResetTokenExpiraEm = @ResetTokenExpiraEm
          WHERE Id = @Id
        `)
    );

    const resetUrl = `${process.env.APP_URL}${process.env.RESET_PASSWORD_PATH}?token=${token}`;

    await enviarEmail({
      para: email,
      assunto: `[${process.env.APP_NAME}] Redefinição de senha`,
      html: `
        <p>Olá,</p>

        <p>Recebemos uma solicitação para redefinir a senha da sua conta na
        <strong>${process.env.APP_NAME}</strong>.</p>

        <p>Clique no link abaixo para criar uma nova senha:</p>

        <p>
          <a href="${resetUrl}">
            Redefinir senha
          </a>
        </p>

        <p>Este link é válido por <strong>10 minutos</strong>.</p>

        <p>Se você não solicitou esta alteração, ignore este e-mail.</p>

        <hr />
        <p><strong>${process.env.APP_NAME}</strong><br />Sistema de Agendamentos</p>
      `
    });

    return res.json({
      mensagem: 'Se o email existir, enviaremos instruções'
    });

  } catch (error) {
    console.error('Erro esqueceuSenha:', error);
    return res.status(500).json({
      mensagem: 'Erro interno'
    });
  }
}

/**
 * ============================
 * RESETAR SENHA
 * ============================
 */
async function resetarSenha(req, res) {
  try {
    const { token, novaSenha } = req.body;

    if (!token || !novaSenha) {
      return res.status(400).json({
        mensagem: 'Token e nova senha são obrigatórios'
      });
    }

    if (!senhaForte(novaSenha)) {
      return res.status(400).json({
        mensagem: 'A senha não atende aos critérios de segurança'
      });
    }

    const result = await sql.connect().then(pool =>
      pool.request()
        .input('Token', sql.VarChar(255), token)
        .query(`
          SELECT Id
          FROM Usuario
          WHERE ResetToken = @Token
            AND ResetTokenExpiraEm > GETDATE()
        `)
    );

    if (result.recordset.length === 0) {
      return res.status(400).json({
        mensagem: 'Token inválido ou expirado'
      });
    }

    const usuarioId = result.recordset[0].Id;
    const senhaHash = await bcrypt.hash(novaSenha, 10);

    await sql.connect().then(pool =>
      pool.request()
        .input('Id', sql.Int, usuarioId)
        .input('SenhaHash', sql.VarChar(255), senhaHash)
        .query(`
          UPDATE Usuario
          SET
            SenhaHash = @SenhaHash,
            ResetToken = NULL,
            ResetTokenExpiraEm = NULL,
            PrecisaTrocarSenha = 0
          WHERE Id = @Id
        `)
    );

    return res.json({
      mensagem: 'Senha redefinida com sucesso'
    });

  } catch (error) {
    console.error('Erro resetarSenha:', error);
    return res.status(500).json({
      mensagem: 'Erro interno'
    });
  }
}

module.exports = {
  esqueceuSenha,
  resetarSenha
};