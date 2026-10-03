const { sql } = require('../config/database');
const { avisarCliente, mensagemCancelamentoClinica } = require('../services/avisoCliente.service');

/**
 * =========================
 * CANCELAR TODOS OS ATENDIMENTOS DO DIA
 * =========================
 * Para imprevistos da profissional (doença, emergência...).
 * Cancela tudo que está marcado na data, sem multa, avisa cada
 * cliente no app e, se pedido, bloqueia o dia inteiro na agenda.
 * Devolve a lista de clientes para a clínica avisar pelo WhatsApp.
 *
 * Body: { data: 'YYYY-MM-DD', motivo?: string, bloquearDia?: boolean }
 */
async function cancelarDia(req, res) {
  const { data, bloquearDia } = req.body;
  const motivo = String(req.body.motivo || '').trim().slice(0, 500) || null;
  const clinicaId = req.clinicaId;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(data || '')) {
    return res.status(400).json({ sucesso: false, mensagem: 'Data inválida' });
  }

  try {
    const pool = await sql.connect();

    const ativos = await pool.request()
      .input('ClinicaId', sql.Int, clinicaId)
      .input('Data', sql.Date, data)
      .query(`
        SELECT
          a.Id,
          a.ClienteId,
          a.GrupoAgendamento,
          CONVERT(VARCHAR(5), a.HoraInicio, 108) AS HoraInicio,
          c.Nome,
          c.Telefone,
          s.Titulo
        FROM Agendamento a
        JOIN Cliente c ON c.Id = a.ClienteId
        JOIN Servico s ON s.Id = a.ServicoId
        WHERE a.ClinicaId = @ClinicaId
          AND a.DataAgendamento = @Data
          AND a.Status IN ('CRIADO', 'CONFIRMADO')
        ORDER BY a.HoraInicio
      `);

    const itens = ativos.recordset;

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      if (itens.length > 0) {
        await new sql.Request(transaction)
          .input('ClinicaId', sql.Int, clinicaId)
          .input('Data', sql.Date, data)
          .input('Motivo', sql.VarChar(500), motivo)
          .query(`
            UPDATE Agendamento
            SET Status = 'CANCELADO',
                CanceladoEm = GETDATE(),
                CanceladoPor = 'CLINICA',
                MotivoCancelamento = @Motivo,
                MultaPercentual = NULL,
                ValorMulta = NULL
            WHERE ClinicaId = @ClinicaId
              AND DataAgendamento = @Data
              AND Status IN ('CRIADO', 'CONFIRMADO')
          `);
      }

      // Bloqueia o dia todo para ninguém agendar (app ou balcão)
      if (bloquearDia === true) {
        await new sql.Request(transaction)
          .input('ClinicaId', sql.Int, clinicaId)
          .input('Data', sql.Date, data)
          .input('Observacao', sql.VarChar(500), motivo || 'Dia bloqueado')
          .query(`
            INSERT INTO ExcecaoAgenda
              (ClinicaId, TipoExcecao, Data, DataInicio, DataFim, HoraInicio, HoraFim, Observacao, DataCadastro, Ativa)
            VALUES
              (@ClinicaId, 'FECHAR', @Data, @Data, @Data, '00:00', '23:59', @Observacao, GETDATE(), 1)
          `);
      }

      await transaction.commit();
    } catch (erroTransacao) {
      await transaction.rollback();
      throw erroTransacao;
    }

    // Um aviso por atendimento (serviços do mesmo grupo viram um aviso só)
    const avisados = new Set();
    for (const item of itens) {
      const chave = item.GrupoAgendamento || `a${item.Id}`;
      if (avisados.has(chave)) continue;
      avisados.add(chave);

      await avisarCliente(pool, {
        agendamentoId: item.Id,
        tipo: 'AGENDAMENTO_CANCELADO',
        titulo: 'Horário cancelado pela clínica',
        mensagem: mensagemCancelamentoClinica(motivo)
      });
    }

    // Lista por cliente, para a clínica avisar pelo WhatsApp
    const porCliente = new Map();
    for (const item of itens) {
      if (!porCliente.has(item.ClienteId)) {
        porCliente.set(item.ClienteId, {
          nome: item.Nome,
          telefone: item.Telefone || null,
          horario: item.HoraInicio,
          servicos: []
        });
      }
      porCliente.get(item.ClienteId).servicos.push(item.Titulo);
    }

    return res.json({
      sucesso: true,
      cancelados: itens.length,
      diaBloqueado: bloquearDia === true,
      clientes: [...porCliente.values()]
    });

  } catch (error) {
    console.error('Erro ao cancelar o dia:', error);
    return res.status(500).json({ sucesso: false, mensagem: 'Não foi possível cancelar o dia. Tente novamente.' });
  }
}

module.exports = { cancelarDia };
