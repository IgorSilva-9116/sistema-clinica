const bcrypt = require('bcrypt');
const { sql } = require('../config/database');
const { gerarSessaoUsuario } = require('../utils/tokenUsuario');
const { normalizarTelefone } = require('../utils/telefone');

// ===============================
// LOGIN ÚNICO (clínica, profissional e cliente)
// ===============================
async function loginUnico(req, res) {
  try {
    // "login" aceita e-mail ou celular (clientes sem e-mail entram pelo celular)
    const { senha } = req.body;
    const login = String(req.body.login || req.body.email || '').trim();

    if (!login || !senha) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Login e senha são obrigatórios'
      });
    }

    const porEmail = login.includes('@');
    const telefone = porEmail ? null : normalizarTelefone(login);

    if (!porEmail && !telefone) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Credenciais inválidas'
      });
    }

    const result = await sql.connect().then(pool =>
      pool.request()
        .input('Email', sql.VarChar(150), porEmail ? login : null)
        .input('Telefone', sql.VarChar(20), telefone)
        .query(`
          SELECT
            Id,
            Email,
            Nome,
            SenhaHash,
            Role,
            UserTipo,
            ClinicaId,
            ProfissionalId,
            ClienteId,
            PrecisaTrocarSenha
          FROM Usuario
          WHERE (Email = @Email OR Telefone = @Telefone)
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

    const sessao = gerarSessaoUsuario(usuario);

    return res.status(200).json({
      sucesso: true,
      ...sessao
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
  loginUnico
};
