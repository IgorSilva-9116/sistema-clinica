const { sql } = require('../config/database');
const { obterBlocosEfetivosDia } = require('../utils/blocosEfetivosDia');
const { gerarSlots } = require('../utils/gerarSlots');
const { existeConflitoAgendamento } = require('../utils/validarConflitoAgendamento');
const { notificarVagaDisponivel } = require('../services/notificacao.service');
const { avisarCliente } = require('../services/avisoCliente.service');
const { minutosAte } = require('../utils/dataHoraBrasil');


const {
  notificarAgendamentoCriado,
  notificarAgendamentoConfirmado,
  notificarAgendamentoCancelado
} = require('../services/notificacao.service');

/**
 * =========================
 * CRIAR AGENDAMENTO
 * =========================
 */

async function criarAgendamento(req, res) {
  try {
    const clinicaId = req.clinicaId;
    const { data, dataAgendamento, horaInicio, servicoId, clienteId } = req.body;
    const dataFinal = data || dataAgendamento;

    if (!dataFinal || !horaInicio || !servicoId || !clienteId) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Parâmetros obrigatórios não informados'
      });
    }

    const pool = await sql.connect();

    // ✅ CONTROLE DE LIBERAÇÃO
    const configResult = await pool.request()
      .input('ClinicaId', sql.Int, clinicaId)
      .query(`
        SELECT
          DiasLiberacaoAgenda,
          DataLimiteAgenda
        FROM ConfiguracaoClinica
        WHERE ClinicaId = @ClinicaId
      `);


    const diasLiberacao =
      configResult.recordset[0] &&
        configResult.recordset[0].DiasLiberacaoAgenda
        ? configResult.recordset[0].DiasLiberacaoAgenda
        : 0;

    if (
      diasLiberacao === 0 &&
      !configResult.recordset[0]?.DataLimiteAgenda
    ) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Agenda indisponível. Aguarde liberação da clínica.'
      });
    }

    if (typeof dataFinal !== 'string') {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Data inválida'
      });
    }

    const [ano, mes, dia] = dataFinal.split('-');
    const dataSelecionada = new Date(ano, mes - 1, dia);

    const dataLimiteAgenda =
      configResult.recordset[0]?.DataLimiteAgenda;

    if (
      diasLiberacao > 0 &&
      !dataLimiteAgenda
    ) {

      const hoje = new Date();
      const limite = new Date();

      limite.setDate(
        hoje.getDate() + diasLiberacao
      );

      dataSelecionada.setHours(0, 0, 0, 0);
      limite.setHours(0, 0, 0, 0);

      if (dataSelecionada > limite) {

        return res.status(400).json({
          sucesso: false,
          mensagem:
            `Agenda disponível até ${limite.toLocaleDateString('pt-BR')}`
        });

      }

    }

    if (dataLimiteAgenda) {

      const limite =
        new Date(
          dataLimiteAgenda +
          'T00:00:00'
        );

      limite.setHours(0, 0, 0, 0);

      if (dataSelecionada > limite) {

        return res.status(400).json({
          sucesso: false,
          mensagem:
            `Agenda disponível até ${limite.toLocaleDateString('pt-BR')}`
        });

      }

    }

    // ✅ CLIENTE
    const clienteAtivoResult = await pool.request()
      .input('ClinicaId', sql.Int, clinicaId)
      .input('ClienteId', sql.Int, clienteId)
      .query(`
        SELECT Status
        FROM ClinicaCliente
        WHERE ClinicaId = @ClinicaId
          AND ClienteId = @ClienteId
      `);

    if (
      clienteAtivoResult.recordset.length === 0 ||
      clienteAtivoResult.recordset[0].Status !== 'Ativo'
    ) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Cliente inativo.'
      });
    }

    // ✅ SERVIÇO
    const servicoResult = await pool.request()
      .input('ServicoId', sql.Int, servicoId)
      .input('ClinicaId', sql.Int, clinicaId)
      .query(`
    SELECT DuracaoMinutos, Preco
    FROM Servico
    WHERE Id = @ServicoId
      AND ClinicaId = @ClinicaId
      AND Status = 'Ativo'
  `);

    if (servicoResult.recordset.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Serviço não encontrado'
      });
    }

    const { DuracaoMinutos, Preco } = servicoResult.recordset[0];

    const [h, m] = horaInicio.split(':').map(Number);
    const totalMin = h * 60 + m + DuracaoMinutos;

    const horaFim =
      String(Math.floor(totalMin / 60)).padStart(2, '0') + ':' +
      String(totalMin % 60).padStart(2, '0');

    const diaDisponivel = await obterBlocosEfetivosDia(clinicaId, dataFinal);
    const slots = gerarSlots(diaDisponivel.blocos, DuracaoMinutos);

    if (!slots.includes(horaInicio)) {
      return res.status(409).json({
        sucesso: false,
        mensagem: 'Horário indisponível'
      });
    }

    // 🔒 ✅ TRANSAÇÃO (CORREÇÃO PRINCIPAL)
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    try {
      const request = new sql.Request(transaction);

      // 🔒 REVALIDAÇÃO DENTRO DA TRANSAÇÃO
      const conflito = await existeConflitoAgendamento(
        clinicaId,
        dataFinal,
        horaInicio,
        horaFim,
        request // ✅ importante
      );

      if (conflito) {
        await transaction.rollback();
        return res.status(409).json({
          sucesso: false,
          mensagem: 'Conflito com outro agendamento'
        });
      }

      // ✅ INSERT SEGURO
      await request
        .input('ClinicaId', sql.Int, clinicaId)
        .input('ServicoId', sql.Int, servicoId)
        .input('ClienteId', sql.Int, clienteId)
        .input('DataAgendamento', sql.Date, dataFinal)
        .input('HoraInicio', sql.VarChar(8), horaInicio + ':00')
        .input('HoraFim', sql.VarChar(8), horaFim + ':00')
        .input('ValorServico', sql.Decimal(10, 2), Preco)
        .query(`
      INSERT INTO Agendamento
      (ClinicaId, ServicoId, ClienteId, DataAgendamento, HoraInicio, HoraFim, Status, ValorServico)
      VALUES
      (@ClinicaId, @ServicoId, @ClienteId, @DataAgendamento,
       CAST(@HoraInicio AS TIME), CAST(@HoraFim AS TIME),
       'CRIADO', @ValorServico)
    `);

      await transaction.commit();

    } catch (err) {
      await transaction.rollback();
      throw err;
    }

    // ✅ NOTIFICAÇÃO (fora da transação)
    const clienteResult = await pool.request()
      .input('ClienteId', sql.Int, clienteId)
      .query(`SELECT Nome, Email FROM Cliente WHERE Id = @ClienteId`);

    if (clienteResult.recordset.length > 0) {
      try {
        await notificarAgendamentoCriado({
          cliente: clienteResult.recordset[0]
        });
      } catch (err) {
        console.warn('Erro ao enviar email:', err.message);
      }
    }

    return res.status(201).json({
      sucesso: true,
      mensagem: 'Agendamento criado com sucesso'
    });


  } catch (err) {
    console.error('ERRO AO CRIAR:', err);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao criar agendamento'
    });
  }
}


/**
 * =========================
 * LISTAR AGENDA CLINICA
 * =========================
 */

async function listarAgendaClinica(req, res) {
  try {
    if (req.userTipo !== 'clinica') {
      return res.status(403).json({
        sucesso: false,
        mensagem: 'Apenas clínicas podem acessar a agenda'
      });
    }

    const clinicaId = req.clinicaId;
    const { data } = req.query;

    if (!data) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Parâmetro data é obrigatório'
      });
    }

    const pool = await sql.connect();

    const result = await pool.request()
      .input('ClinicaId', sql.Int, clinicaId)
      .input('DataAgendamento', sql.Date, data)
      .query(`
        SELECT
          a.Id,
          CONVERT(VARCHAR(5), a.HoraInicio, 108) AS HoraInicio,
          CONVERT(VARCHAR(5), a.HoraFim, 108) AS HoraFim,
          a.Status,
          a.Origem,
          s.Titulo AS Servico,
          c.Nome AS Cliente
        FROM Agendamento a
        JOIN Servico s ON s.Id = a.ServicoId
        JOIN Cliente c ON c.Id = a.ClienteId
        WHERE a.ClinicaId = @ClinicaId
          AND a.DataAgendamento = @DataAgendamento
          AND a.Status != 'CANCELADO'
        ORDER BY a.HoraInicio
      `);

    return res.json({
      sucesso: true,
      agendamentos: result.recordset
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao listar agenda'
    });
  }
}

/**
 * =========================
 * CONFIRMAR AGENDAMENTO
 * =========================
 */
async function confirmarAgendamento(req, res) {
  try {
    if (req.userTipo !== 'clinica') {
      return res.status(403).json({
        sucesso: false,
        mensagem: 'Apenas a clínica pode confirmar agendamentos'
      });
    }

    const clinicaId = req.clinicaId;
    const { id } = req.params;
    const pool = await sql.connect();

    // Confirma também os outros serviços marcados juntos (mesmo atendimento)
    const result = await pool.request()
      .input('Id', sql.Int, Number(id))
      .input('ClinicaId', sql.Int, clinicaId)
      .query(`
        UPDATE a
        SET Status = 'CONFIRMADO', ConfirmadoEm = GETDATE()
        FROM Agendamento a
        JOIN Agendamento ref ON ref.Id = @Id AND ref.ClinicaId = @ClinicaId AND ref.Status = 'CRIADO'
        WHERE a.ClinicaId = @ClinicaId
          AND a.Status = 'CRIADO'
          AND (a.Id = @Id OR (ref.GrupoAgendamento IS NOT NULL AND a.GrupoAgendamento = ref.GrupoAgendamento))
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Agendamento não pode ser confirmado'
      });
    }

    await avisarCliente(pool, {
      agendamentoId: Number(id),
      tipo: 'AGENDAMENTO_CONFIRMADO',
      titulo: 'Horário confirmado',
      mensagem: atendimento => `Seu horário de ${atendimento} está confirmado. Esperamos você!`
    });

    // 🔔 Buscar dados para notificação
    const dados = await pool.request()
      .input('Id', sql.Int, Number(id))
      .query(`
        SELECT
         c.Nome,
         c.Email,
         a.DataAgendamento,
         CONVERT(VARCHAR(5), a.HoraInicio, 108) AS HoraInicio,
         CONVERT(VARCHAR(5), a.HoraFim, 108) AS HoraFim
        FROM Agendamento a
        JOIN Cliente c ON c.Id = a.ClienteId
        WHERE a.Id = @Id
      `);

    // E-mail é complementar: se falhar, a confirmação continua valendo
    if (dados.recordset.length > 0 && dados.recordset[0].Email) {
      try {
        await notificarAgendamentoConfirmado({
          cliente: dados.recordset[0],
          agendamento: dados.recordset[0]
        });
      } catch (err) {
        console.warn('Erro ao enviar e-mail de confirmação:', err.message);
      }
    }

    return res.json({
      sucesso: true,
      mensagem: 'Agendamento confirmado com sucesso'
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao confirmar agendamento'
    });
  }
}

/**
 * =========================
 * CANCELAR AGENDAMENTO
 * =========================
 */

async function cancelarAgendamento(req, res) {
  try {
    const { id } = req.params;
    const { bloquearHorario, motivo, origem } = req.body;
    const clinicaId = req.clinicaId;

    const pool = await sql.connect();

    const agendamentoResult = await pool.request()
      .input('Id', sql.Int, Number(id))
      .input('ClinicaId', sql.Int, clinicaId)
      .query(`
        SELECT
          a.*,
          c.Nome,
          c.Email
        FROM Agendamento a
        JOIN Cliente c ON c.Id = a.ClienteId
        WHERE a.Id = @Id AND a.ClinicaId = @ClinicaId
      `);

    if (!agendamentoResult.recordset.length) {
      return res.status(404).json({ sucesso: false });
    }

    const ag = agendamentoResult.recordset[0];

    // ✅ MULTA SOMENTE PARA CANCELAMENTO PELO CLIENTE
    let multaPercentual = null;
    let valorMulta = null;

    if (origem === 'CLIENTE') {

      const configResult = await pool.request()
        .input('ClinicaId', sql.Int, clinicaId)
        .query(`
      SELECT
        JanelaCancelamentoHoras,
        MultaPercentual
      FROM ConfiguracaoClinica
      WHERE ClinicaId = @ClinicaId
    `);

      const config = configResult.recordset[0];

      if (config) {

        const dataAgendamento =
          ag.DataAgendamento
            .toISOString()
            .split('T')[0];

        const horaAgendamento =
          ag.HoraInicio.toISOString
            ? ag.HoraInicio.toISOString().substring(11, 16)
            : String(ag.HoraInicio).substring(0, 5);

        // Horário de Brasília (o servidor no Render roda em UTC)
        const horasAntecedencia =
          minutosAte(dataAgendamento, horaAgendamento) / 60;

        if (
          horasAntecedencia <
          Number(config.JanelaCancelamentoHoras || 0)
        ) {

          multaPercentual =
            Number(config.MultaPercentual || 0);

          valorMulta =
            Number(
              (
                Number(ag.ValorServico || 0) *
                multaPercentual /
                100
              ).toFixed(2)
            );

        }

      }

    }

    if (!['CRIADO', 'CONFIRMADO'].includes(ag.Status)) {
      return res.status(400).json({ sucesso: false });
    }

    // ✅ HORA CORRETA (GARANTIDO)
    const horaFormatada = ag.HoraInicio.toISOString
      ? ag.HoraInicio.toISOString().substring(11, 16)
      : String(ag.HoraInicio).substring(0, 5);

    const canceladoPor = origem === 'CLIENTE' ? 'CLIENTE' : 'CLINICA';

    // ✅ CANCELA
    await pool.request()
      .input('Id', sql.Int, Number(id))
      .input('Motivo', sql.VarChar(500), motivo || null)
      .input('MultaPercentual', sql.Decimal(5, 2), multaPercentual)
      .input('ValorMulta', sql.Decimal(10, 2), valorMulta)
      .input('CanceladoPor', sql.VarChar(20), canceladoPor)
      .query(`
        UPDATE Agendamento
        SET
          Status = 'CANCELADO',
          CanceladoEm = GETDATE(),
          CanceladoPor = @CanceladoPor,
          MotivoCancelamento = @Motivo,
          MultaPercentual = @MultaPercentual,
          ValorMulta = @ValorMulta
          WHERE Id = @Id
      `);

    // ✅ EXCEÇÃO (mantida como você pediu)
    if (origem === 'CLINICA' && bloquearHorario === true) {
      await pool.request()
        .input('ClinicaId', sql.Int, clinicaId)
        .input('Data', sql.Date, ag.DataAgendamento)
        .input('HoraInicio', sql.Time, ag.HoraInicio)
        .input('HoraFim', sql.Time, ag.HoraFim)
        .query(`
          INSERT INTO ExcecaoAgenda
          (ClinicaId, TipoExcecao, Data, HoraInicio, HoraFim, Ativa)
          VALUES (@ClinicaId, 'FECHAR', @Data, @HoraInicio, @HoraFim, 1)
        `);
    }

    // Aviso no app quando quem cancelou foi a clínica
    if (canceladoPor === 'CLINICA') {
      await avisarCliente(pool, {
        agendamentoId: Number(id),
        tipo: 'AGENDAMENTO_CANCELADO',
        titulo: 'Horário cancelado pela clínica',
        mensagem: atendimento =>
          `Seu horário de ${atendimento} foi cancelado pela clínica.` +
          (motivo ? ` Motivo: ${motivo}.` : '') +
          ' Se quiser, agende um novo horário pelo app ou fale conosco.'
      });
    }

    // ✅ NOTIFICA CANCELAMENTO (NÃO QUEBRA MAIS)
    if (ag.Email) {
      try {
        await notificarAgendamentoCancelado({
          cliente: { Nome: ag.Nome, Email: ag.Email },
          multa: valorMulta
        });
      } catch (e) {
        console.warn('Erro email cancelamento');
      }
    }

    // ✅ 🔥 BUSCA LISTA (SIMPLIFICADO E GARANTIDO)
    const listaEspera = await pool.request()
      .input('ClinicaId', sql.Int, clinicaId)
      .input('Data', sql.Date, ag.DataAgendamento)
      .query(`
        SELECT le.*, c.Nome, c.Email
        FROM ListaEspera le
        JOIN Cliente c ON c.Id = le.ClienteId
        WHERE le.ClinicaId = @ClinicaId
          AND le.DataAgendamento = @Data
         AND le.Status = 'Ativo'
         AND le.Notificado = 0 
      `);

    console.log('DEBUG LISTA:', listaEspera.recordset.length);

    // ✅ 🔥 FILTRA NO NODE (GARANTE 100%)
    const listaFiltrada = listaEspera.recordset.filter(l =>
      l.HoraDesejada === horaFormatada
    );

    console.log('DEBUG FILTRADA:', listaFiltrada.length);

    // ✅ 🔥 ENVIO SEGURO
    for (const item of listaFiltrada) {
      try {
        await notificarVagaDisponivel({
          cliente: {
            Nome: item.Nome,
            Email: item.Email
          },
          data: ag.DataAgendamento,
          hora: horaFormatada
        });

        await pool.request()
          .input('Id', sql.Int, item.Id)
          .query(`
             UPDATE ListaEspera
             SET Notificado = 1
             WHERE Id = @Id
          `)

      } catch (e) {
        console.warn('Erro fila');
      }
    }

    return res.json({
      sucesso: true
    });

  } catch (err) {
    console.error('ERRO CANCELAMENTO:', err);

    return res.status(500).json({
      sucesso: false
    });
  }
}

/**
 * =========================
 * FINALIZAR AGENDAMENTOS (LOTE)
 * =========================
 */
async function finalizarAgendamentos(req, res) {
  try {
    if (req.userTipo !== 'clinica') {
      return res.status(403).json({
        sucesso: false,
        mensagem: 'Apenas a clínica pode finalizar agendamentos'
      });
    }

    const clinicaId = req.clinicaId;
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Lista de agendamentos inválida'
      });
    }

    const pool = await sql.connect();
    const idsString = ids.map(Number).join(',');

    const result = await pool.request()
      .input('ClinicaId', sql.Int, clinicaId)
      .query(`
        UPDATE Agendamento
        SET Status = 'FINALIZADO', FinalizadoEm = GETDATE()
        WHERE Id IN (${idsString})
          AND ClinicaId = @ClinicaId
          AND Status = 'CONFIRMADO'
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Nenhum agendamento foi finalizado'
      });
    }

    return res.json({
      sucesso: true,
      mensagem: 'Agendamentos finalizados com sucesso',
      totalFinalizados: result.rowsAffected[0]
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao finalizar agendamentos'
    });
  }
}

module.exports = {
  criarAgendamento,
  listarAgendaClinica,
  confirmarAgendamento,
  cancelarAgendamento,
  finalizarAgendamentos
};