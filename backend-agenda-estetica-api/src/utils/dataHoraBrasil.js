/**
 * Data e hora atuais no fuso da clínica (Brasília), independente
 * do fuso do servidor (o Render roda em UTC).
 */
const FUSO = 'America/Sao_Paulo';

function agoraBrasil() {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: FUSO,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    })
      .formatToParts(new Date())
      .map(p => [p.type, p.value])
  );

  return {
    data: `${partes.year}-${partes.month}-${partes.day}`,
    minutos: Number(partes.hour) * 60 + Number(partes.minute)
  };
}

// Soma dias a uma data YYYY-MM-DD (sem depender de fuso)
function somarDias(dataISO, dias) {
  const d = new Date(`${dataISO}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/**
 * Minutos que faltam (horário de Brasília) até a data/hora informada.
 * Negativo se já passou.
 */
function minutosAte(dataISO, horaHHMM) {
  const agora = agoraBrasil();
  const [h, m] = horaHHMM.split(':').map(Number);
  const umDia = 24 * 60;

  const dias = (Date.parse(`${dataISO}T00:00:00Z`) - Date.parse(`${agora.data}T00:00:00Z`)) / 60000 / umDia;

  return dias * umDia + (h * 60 + m) - agora.minutos;
}

module.exports = { agoraBrasil, somarDias, minutosAte };
