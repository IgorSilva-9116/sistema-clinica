/**
 * Celular no formato usado para login: só dígitos, com DDD, sem o 55.
 * "(32) 98888-7777", "+55 32 988887777" -> "32988887777"
 * Retorna null se não parecer um telefone brasileiro válido.
 */
function normalizarTelefone(valor) {
  let digitos = String(valor || '').replace(/\D/g, '');

  if (digitos.length >= 12 && digitos.startsWith('55')) {
    digitos = digitos.slice(2);
  }

  return digitos.length === 10 || digitos.length === 11 ? digitos : null;
}

/**
 * Expressão SQL que remove a formatação de uma coluna de telefone,
 * para comparar com um número já normalizado.
 */
function sqlTelefoneSemFormatacao(coluna) {
  return `REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(${coluna}, ' ', ''), '(', ''), ')', ''), '-', ''), '+', ''), '.', '')`;
}

module.exports = { normalizarTelefone, sqlTelefoneSemFormatacao };
