const jwt = require('jsonwebtoken');

/**
 * Gera o JWT e o objeto "usuario" devolvido ao front
 * a partir de uma linha da tabela Usuario.
 * Usado no login e na ativação/cadastro da cliente.
 */
function gerarSessaoUsuario(usuario) {
  const dados = {
    id: usuario.Id,
    email: usuario.Email,
    nome: usuario.Nome,
    userTipo: usuario.UserTipo,
    role: usuario.Role,
    clinicaId: usuario.ClinicaId,
    profissionalId: usuario.ProfissionalId,
    clienteId: usuario.ClienteId,
    precisaTrocarSenha: Boolean(usuario.PrecisaTrocarSenha)
  };

  const token = jwt.sign(
    {
      userId: dados.id,
      userTipo: dados.userTipo,
      role: dados.role,
      clinicaId: dados.clinicaId,
      profissionalId: dados.profissionalId,
      clienteId: dados.clienteId,
      precisaTrocarSenha: dados.precisaTrocarSenha
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );

  return { token, usuario: dados };
}

module.exports = { gerarSessaoUsuario };
