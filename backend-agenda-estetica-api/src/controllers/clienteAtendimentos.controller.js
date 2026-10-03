const { sql } = require('../config/database');
const { existeConflitoAgendamento } = require('../utils/validarConflitoAgendamento');
const { calcularHorariosLivres, paraMinutos, paraHora } = require('../utils/horariosLivres');
const { agoraBrasil } = require('../utils/dataHoraBrasil');
const {
  ATIVOS,
  paraISO,
  buscarItensAtendimento,
  avaliarPrazo,
  obterPoliticaCancelamento
} = require('../utils/atendimentoCliente');

/**
 * "Meus agendamentos" da cliente: ver, cancelar e remarcar.
 * Sempre usa clienteId/clinicaId do token.
 */

const DATA_VALIDA = /^\d{4}-\d{2}-\d{2}$/;
const HORA_VALIDA = /^\d{2}:\d{2}$/;

// Status do atendimento a partir dos serviços que o compõem
function statusDoAtendimento(itens) {
  const ativos = itens.filter(i => ATIVOS.includes(i.Status));
  if (ativos.length) {
    return ativos.every(i => i.Status === 'CONFIRMADO') ? 'CONFIRMADO' : 'CRIADO';
  }
  return itens.some(i => i.Status === 'FINALIZADO') ? 'FINALIZADO' : 'CANCELADO';
}

/**
 * =========================
 * LISTAR ATENDIMENTOS
 * =========================
 */
async function listarAtendimentos(req, res) {
  try {
    const pool = await sql.connect();

    const result = await pool.request()
      .input('ClienteId', sql.Int, req.clienteId)
      .input('ClinicaId', sql.Int, req.clinicaId)
      .query(`
        SELECT
          a.Id,
          a.DataAgendamento,
          CONVERT(VARCHAR(5), a.HoraInicio, 108) AS HoraInicio,
          CONVERT(VARCHAR(5), a.HoraFim, 108) AS HoraFim,
          a.Status,
          a.ValorServico,
          a.ValorMulta,
          a.CanceladoPor,
          a.MotivoCancelamento,
          a.GrupoAgendamento,
          s.Id AS ServicoId,
          s.Titulo
        FROM Agendamento a
        JOIN Servico s ON s.Id = a.ServicoId
        WHERE a.ClienteId = @ClienteId
          AND a.ClinicaId = @ClinicaId
          AND a.DataAgendamento >= DATEADD(MONTH, -12, CAST(GETDATE() AS DATE))
        ORDER BY a.DataAgendamento, a.HoraInicio
      `);

    // Junta os serviços do mesmo atendimento
    const grupos = new Map();
    for (const item of result.recordset) {
      const chave = item.GrupoAgendamento || `a${item.Id}`;
      if (!grupos.has(chave)) grupos.set(chave, []);
      grupos.get(chave).push(item);
    }

    const politica = await obterPoliticaCancelamento(pool, req.clinicaId);
    const hoje = agoraBrasil().data;

    const atendimentos = [...grupos.values()].map(itens => {
      const ativos = itens.filter(i => ATIVOS.includes(i.Status));
      const status = statusDoAtendimento(itens);
      const prazo = avaliarPrazo(ativos, politica);
      const data = paraISO(itens[0].DataAgendamento);
      const valorBase = ativos.length ? ativos : itens;
      const cancelado = itens.find(i => i.Status === 'CANCELADO');

      return {
        id: itens[0].Id,
        data,
        horaInicio: (ativos[0] || itens[0]).HoraInicio,
        horaFim: (ativos[ativos.length - 1] || itens[itens.length - 1]).HoraFim,
        status,
        valorTotal: valorBase.reduce((t, i) => t + Number(i.ValorServico || 0), 0),
        valorMulta: itens.reduce((t, i) => t + Number(i.ValorMulta || 0), 0),
        canceladoPor: status === 'CANCELADO' ? cancelado?.CanceladoPor || null : null,
        motivoCancelamento: status === 'CANCELADO' ? cancelado?.MotivoCancelamento || null : null,
        proximo: ativos.length > 0 && data >= hoje,
        podeCancelar: prazo.futuro,
        podeRemarcar: prazo.futuro && !prazo.dentroDaJanela,
        multaSeCancelar: prazo.futuro ? { percentual: prazo.multaPercentual, valor: prazo.valorMulta } : null,
        servicos: itens.map(i => ({
          id: i.Id,
          servicoId: i.ServicoId,
          titulo: i.Titulo,
          horaInicio: i.HoraInicio,
          horaFim: i.HoraFim,
          valor: Number(i.ValorServico || 0),
          status: i.Status
        }))
      };
    });

    const proximos = atendimentos.filter(a => a.proximo);
    const historico = atendimentos.filter(a => !a.proximo).reverse();

    res.set('Cache-Control', 'no-store');
    return res.json({
      sucesso: true,
      proximos,
      historico,
      politica: {
        janelaCancelamentoHoras: Number(politica.JanelaCancelamentoHoras || 0),
        multaPercentual: Number(politica.MultaPercentual || 0)
      }
    });

  } catch (error) {
    console.error('Erro ao listar atendimentos (cliente):', error);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro ao carregar seus agendamentos' });
  }
}

/**
 * =========================
 * CANCELAR ATENDIMENTO (todos os serviços da visita)
 * =========================
 * Fora do prazo é permitido, mas registra a multa da política.
 */
async function cancelarAtendimento(req, res) {
  try {
    const pool = await sql.connect();
    const itens = await buscarItensAtendimento(pool, {
      agendamentoId: req.params.id,
      clienteId: req.clienteId,
      clinicaId: req.clinicaId
    });

    const ativos = itens.filter(i => ATIVOS.includes(i.Status));
    if (ativos.length === 0) {
      return res.status(404).json({ sucesso: false, mensagem: 'Agendamento não encontrado ou já cancelado' });
    }

    const prazo = avaliarPrazo(ativos, await obterPoliticaCancelamento(pool, req.clinicaId));
    if (!prazo.futuro) {
      return res.status(400).json({ sucesso: false, mensagem: 'Este horário já passou. Fale conosco.' });
    }

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      for (const item of ativos) {
        await new sql.Request(transaction)
          .input('Id', sql.Int, item.Id)
          .input('Motivo', sql.VarChar(500), String(req.body?.motivo || '').slice(0, 500) || null)
          .input('MultaPercentual', sql.Decimal(5, 2), prazo.multaPercentual || null)
          .input('ValorMulta', sql.Decimal(10, 2),
            prazo.multaPercentual ? Number((Number(item.ValorServico || 0) * prazo.multaPercentual / 100).toFixed(2)) : null)
          .query(`
            UPDATE Agendamento
            SET Status = 'CANCELADO',
                CanceladoEm = GETDATE(),
                CanceladoPor = 'CLIENTE',
                MotivoCancelamento = @Motivo,
                MultaPercentual = @MultaPercentual,
                ValorMulta = @ValorMulta
            WHERE Id = @Id
              AND Status IN ('CRIADO', 'CONFIRMADO')
          `);
      }

      await transaction.commit();
    } catch (erroTransacao) {
      await transaction.rollback();
      throw erroTransacao;
    }

    return res.json({
      sucesso: true,
      mensagem: prazo.valorMulta > 0
        ? `Agendamento cancelado. Multa de ${prazo.multaPercentual}% registrada.`
        : 'Agendamento cancelado.',
      valorMulta: prazo.valorMulta
    });

  } catch (error) {
    console.error('Erro ao cancelar atendimento (cliente):', error);
    return res.status(500).json({ sucesso: false, mensagem: 'Não foi possível cancelar. Tente novamente.' });
  }
}

/**
 * =========================
 * REMARCAR ATENDIMENTO
 * =========================
 * Só dentro do prazo da política. Mantém os mesmos serviços, em
 * sequência no novo horário, e volta a aguardar confirmação.
 */
async function remarcarAtendimento(req, res) {
  const { data, horaInicio } = req.body;

  if (!DATA_VALIDA.test(data || '') || !HORA_VALIDA.test(horaInicio || '')) {
    return res.status(400).json({ sucesso: false, mensagem: 'Escolha o novo dia e horário' });
  }

  try {
    const pool = await sql.connect();
    const itens = await buscarItensAtendimento(pool, {
      agendamentoId: req.params.id,
      clienteId: req.clienteId,
      clinicaId: req.clinicaId
    });

    const ativos = itens.filter(i => ATIVOS.includes(i.Status));
    if (ativos.length === 0) {
      return res.status(404).json({ sucesso: false, mensagem: 'Agendamento não encontrado ou cancelado' });
    }

    const prazo = avaliarPrazo(ativos, await obterPoliticaCancelamento(pool, req.clinicaId));
    if (!prazo.futuro || prazo.dentroDaJanela) {
      return res.status(400).json({
        sucesso: false,
        codigo: 'FORA_DO_PRAZO',
        mensagem: 'O prazo para remarcar pelo app já passou. Fale conosco.'
      });
    }

    const ids = ativos.map(i => i.Id);
    const duracaoTotal = ativos.reduce((t, i) => t + i.DuracaoMinutos, 0);

    const livres = await calcularHorariosLivres(pool, {
      clinicaId: req.clinicaId,
      data,
      duracaoMinutos: duracaoTotal,
      ignorarIds: ids
    });

    if (!livres.includes(horaInicio)) {
      return res.status(409).json({
        sucesso: false,
        codigo: 'HORARIO_INDISPONIVEL',
        mensagem: 'Esse horário acabou de ser ocupado. Escolha outro, por favor.'
      });
    }

    let cursor = paraMinutos(horaInicio);
    const novos = ativos.map(item => {
      const novo = { id: item.Id, titulo: item.Titulo, inicio: paraHora(cursor), fim: paraHora(cursor + item.DuracaoMinutos) };
      cursor += item.DuracaoMinutos;
      return novo;
    });
    const horaFim = novos[novos.length - 1].fim;

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const conflito = await existeConflitoAgendamento(
        req.clinicaId, data, horaInicio, horaFim, new sql.Request(transaction), ids
      );

      if (conflito) {
        await transaction.rollback();
        return res.status(409).json({
          sucesso: false,
          codigo: 'HORARIO_INDISPONIVEL',
          mensagem: 'Esse horário acabou de ser ocupado. Escolha outro, por favor.'
        });
      }

      for (const novo of novos) {
        await new sql.Request(transaction)
          .input('Id', sql.Int, novo.id)
          .input('Data', sql.Date, data)
          .input('HoraInicio', sql.VarChar(8), novo.inicio + ':00')
          .input('HoraFim', sql.VarChar(8), novo.fim + ':00')
          .query(`
            UPDATE Agendamento
            SET DataAgendamento = @Data,
                HoraInicio = CAST(@HoraInicio AS TIME),
                HoraFim = CAST(@HoraFim AS TIME),
                Status = 'CRIADO',
                ConfirmadoEm = NULL
            WHERE Id = @Id
          `);
      }

      await transaction.commit();
    } catch (erroTransacao) {
      await transaction.rollback();
      throw erroTransacao;
    }

    return res.json({
      sucesso: true,
      agendamento: {
        data,
        horaInicio,
        horaFim,
        servicos: novos.map(n => ({ titulo: n.titulo, horaInicio: n.inicio, horaFim: n.fim }))
      }
    });

  } catch (error) {
    console.error('Erro ao remarcar atendimento (cliente):', error);
    return res.status(500).json({ sucesso: false, mensagem: 'Não foi possível remarcar. Tente novamente.' });
  }
}

/**
 * =========================
 * AVISOS (notificações no app)
 * =========================
 */
async function listarNotificacoes(req, res) {
  try {
    const result = await sql.connect().then(pool =>
      pool.request()
        .input('ClienteId', sql.Int, req.clienteId)
        .input('ClinicaId', sql.Int, req.clinicaId)
        .query(`
          SELECT TOP 20 Id AS id, Tipo AS tipo, Titulo AS titulo, Mensagem AS mensagem,
                 Lida AS lida, CriadaEm AS criadaEm
          FROM Notificacao
          WHERE ClienteId = @ClienteId AND ClinicaId = @ClinicaId
          ORDER BY CriadaEm DESC
        `)
    );

    res.set('Cache-Control', 'no-store');
    return res.json({
      sucesso: true,
      naoLidas: result.recordset.filter(n => !n.lida).length,
      notificacoes: result.recordset
    });

  } catch (error) {
    console.error('Erro ao listar avisos (cliente):', error);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro ao carregar os avisos' });
  }
}

async function marcarNotificacoesLidas(req, res) {
  try {
    await sql.connect().then(pool =>
      pool.request()
        .input('ClienteId', sql.Int, req.clienteId)
        .input('ClinicaId', sql.Int, req.clinicaId)
        .query(`
          UPDATE Notificacao SET Lida = 1
          WHERE ClienteId = @ClienteId AND ClinicaId = @ClinicaId AND Lida = 0
        `)
    );

    return res.json({ sucesso: true });

  } catch (error) {
    console.error('Erro ao marcar avisos (cliente):', error);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro ao atualizar os avisos' });
  }
}

module.exports = {
  listarAtendimentos,
  cancelarAtendimento,
  remarcarAtendimento,
  listarNotificacoes,
  marcarNotificacoesLidas
};
