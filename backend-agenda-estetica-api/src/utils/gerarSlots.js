/**
 * Gera slots a partir de blocos efetivos
 * Agora com passo fixo de 15 minutos
 *
 * @param {Array<{ inicio: string, fim: string }>} blocos
 * @param {number} duracaoMinutos - mantido por compatibilidade
 * @returns {string[]} lista de horários HH:mm
 */
function gerarSlots(blocos, duracaoMinutos) {
  const slots = [];
  const PASSO_MINUTOS = 15; // ✅ passo fixo da agenda

  for (const bloco of blocos) {
    let inicioMin = horaParaMinutos(bloco.inicio);
    const fimMin = horaParaMinutos(bloco.fim);

    while (inicioMin + PASSO_MINUTOS <= fimMin) {
      slots.push(minutosParaHora(inicioMin));
      inicioMin += PASSO_MINUTOS;
    }
  }

  return slots;
}

/**
 * Converte HH:mm para minutos
 */
function horaParaMinutos(hora) {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Converte minutos para HH:mm
 */
function minutosParaHora(minutos) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

module.exports = {
  gerarSlots
};