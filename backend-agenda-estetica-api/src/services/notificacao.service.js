const { enviarEmail } = require('./email.service');
const { enviarWhatsApp } = require('./whatsapp.service');

/* ✅ UTILIDADE GLOBAL (CORREÇÃO DEFINITIVA DE HORA) */
function formatarHora(hora) {
  if (!hora) return '';

  try {
    // ✅ se já for string tipo "09:00:00"
    if (typeof hora === 'string') {
      return hora.substring(0, 5);
    }

    // ✅ se vier do SQL (Date)
    if (hora instanceof Date) {
      return hora.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    // ✅ fallback absoluto
    const h = new Date(hora);
    return h.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });

  } catch (err) {
    console.warn('Erro ao formatar hora:', hora);
    return '';
  }
}

/* ✅ FORMATAR DATA SEM BUG */
function formatarData(data) {
  if (!data) return '';

  try {
    const iso = data.toISOString().split('T')[0];
    const [ano, mes, dia] = iso.split('-');
    return `${dia}/${mes}/${ano}`;
  } catch {
    return '';
  }
}

/* =========================
   AGENDAMENTO CRIADO
========================= */
async function notificarAgendamentoCriado({ cliente }) {

  const email = cliente.Email || cliente.email || '';
  const nome = cliente.Nome || cliente.nome || 'Cliente';

  if (!email) {
    console.warn('Cliente sem email');
    return;
  }

  await enviarEmail({
    para: email,
    assunto: 'Agendamento recebido',
    html: `
      <p>Olá ${nome},</p>
      <p>Seu agendamento foi recebido com sucesso.</p>
      <p>Em breve a clínica irá confirmar.</p>
    `
  });
}

/* =========================
   AGENDAMENTO CONFIRMADO
========================= */
async function notificarAgendamentoConfirmado({ cliente, agendamento }) {

  const email = cliente.Email || cliente.email || '';
  const nome = cliente.Nome || cliente.nome || 'Cliente';

  const dataBr = formatarData(agendamento.DataAgendamento);
  const horaInicio = formatarHora(agendamento.HoraInicio);
  const horaFim = formatarHora(agendamento.HoraFim);

  await enviarEmail({
    para: email,
    assunto: 'Agendamento confirmado',

    html: `
      <p>Olá ${nome},</p>

      <p>Seu agendamento foi confirmado com sucesso.</p>

      <p>
        <strong>Data:</strong> ${dataBr}<br/>
        <strong>Horário:</strong> ${horaInicio} - ${horaFim}
      </p>

      <p>Em caso de dúvida, estamos à disposição.</p>

      <br/>

      <p>Atenciosamente,<br/>Clínica</p>
    `
  });
}

/* =========================
   AGENDAMENTO CANCELADO
========================= */
async function notificarAgendamentoCancelado({ cliente, multa }) {

  const email = cliente.Email || cliente.email || '';
  const nome = cliente.Nome || cliente.nome || 'Cliente';

  await enviarEmail({
    para: email,
    assunto: 'Agendamento cancelado',
    html: `
      <p>Olá ${nome},</p>
      <p>Seu agendamento foi cancelado.</p>
      ${
        multa
          ? `<p>Foi aplicada uma multa de R$ ${multa.toFixed(2)}.</p>`
          : `<p>Nenhuma multa foi aplicada.</p>`
      }
    `
  });
}

/* =========================
   VAGA DISPONÍVEL
========================= */
async function notificarVagaDisponivel({ cliente, data, hora }) {

  const email = cliente.Email || cliente.email || '';
  const nome = cliente.Nome || cliente.nome || 'Cliente';

  // ✅ DATA SEGURA (sem fuso)
  const dataISO = data.toISOString().split('T')[0];
  const [ano, mes, dia] = dataISO.split('-');
  const dataBr = `${dia}/${mes}/${ano}`;

  // ✅ CORREÇÃO DEFINITIVA DA HORA
  let horaFormatada = '';

  try {
    if (typeof hora === 'string') {
      horaFormatada = hora.substring(0, 5);
    } else {
      const d = new Date(`1970-01-01T${hora}`);
      horaFormatada = d.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  } catch {
    horaFormatada = String(hora).substring(0, 5);
  }

  await enviarEmail({
    para: email,
    assunto: 'Horário disponível para agendamento',

    html: `
      <p>Olá ${nome},</p>

      <p>
        Um horário ficou disponível na agenda para o serviço que você demonstrou interesse.
      </p>

      <p>
        <strong>Data:</strong> ${dataBr}<br/>
        <strong>Horário:</strong> ${horaFormatada}
      </p>

      <p>
        Este horário está sendo liberado para clientes da lista de espera.
      </p>

      <p>
        ⚠️ O agendamento será confirmado para o primeiro cliente que concluir a reserva.
      </p>

      <p>
        Recomendamos realizar o agendamento o quanto antes.
      </p>

      <br/>

      <p>Atenciosamente,<br/>Clínica Dayênia Neves Estética</p>
    `
  });
}

module.exports = {
  notificarAgendamentoCriado,
  notificarAgendamentoConfirmado,
  notificarAgendamentoCancelado,
  notificarVagaDisponivel
};
