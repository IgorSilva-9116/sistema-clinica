/**
 * Regra de senha da cliente: mais simples que a da clínica,
 * pensando em clientes com pouca familiaridade com tecnologia.
 * Mínimo 8 caracteres, com pelo menos uma letra e um número.
 */
function senhaClienteValida(senha) {
  return (
    typeof senha === 'string' &&
    senha.length >= 8 &&
    /[A-Za-z]/.test(senha) &&
    /\d/.test(senha)
  );
}

const MENSAGEM_SENHA_CLIENTE =
  'A senha deve ter no mínimo 8 caracteres, com letras e números';

module.exports = { senhaClienteValida, MENSAGEM_SENHA_CLIENTE };
