/**
 * Verifica se uma data de sábado é ATIVA ou INATIVA
 * com base na regra de sábado alternado.
 *
 * @param {Date} dataInicio - Primeiro sábado ATIVO
 * @param {Date} dataConsulta - Data que queremos validar
 * @returns {boolean} true = ativo | false = inativo
 */
function isSabadoAtivo(dataInicio, dataConsulta) {
  // Normaliza para meia-noite (evita bug de timezone)
  const inicio = new Date(dataInicio);
  inicio.setHours(0, 0, 0, 0);

  const consulta = new Date(dataConsulta);
  consulta.setHours(0, 0, 0, 0);

  // Garantia defensiva: só sábado
  if (consulta.getDay() !== 6) {
    return false;
  }

  // Diferença em milissegundos
  const diffMs = consulta.getTime() - inicio.getTime();

  // Se a data consultada é anterior ao início da regra
  if (diffMs < 0) {
    return false;
  }

  // Converte para semanas completas
  const diffSemanas = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));

  // Alternância: semana par = ativo
  return diffSemanas % 2 === 0;
}

module.exports = {
  isSabadoAtivo
};