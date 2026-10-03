const crypto = require('crypto');
const { sql } = require('../config/database');
const { existeConflitoAgendamento } = require('../utils/validarConflitoAgendamento');
const {
  obterJanelaAgendamento,
  calcularHorariosLivres,
  paraMinutos,
  paraHora
} = require('../utils/horariosLivres');
const { agoraBrasil, somarDias } = require('../utils/dataHoraBrasil');
const { ATIVOS, buscarItensAtendimento } = require('../utils/atendimentoCliente');

/**
 * Agendamento online pela cliente.
 * Sempre usa clienteId/clinicaId do token, nunca da requisição.
 *
 * A cliente pode escolher vários serviços para o mesmo atendimento:
 * eles são marcados em sequência (um logo após o outro), cada um
 * como um Agendamento, ligados pelo mesmo GrupoAgendamento.
 */

// Quantos dias a tela de agendamento mostra de uma vez
const DIAS_EXIBIDOS = 21;

// Evita que uma conta reserve a agenda inteira (conta atendimentos, não serviços)
const MAX_ATENDIMENTOS_ABERTOS = 3;

// Serviços no mesmo atendimento
const MAX_SERVICOS_POR_ATENDIMENTO = 5;

const DATA_VALIDA = /^\d{4}-\d{2}-\d{2}$/;
const HORA_VALIDA = /^\d{2}:\d{2}$/;

/**
 * Aceita [1, 2], "1,2" ou "1" e devolve ids únicos, na ordem escolhida
 */
function lerServicoIds(valor) {
  const lista = Array.isArray(valor) ? valor : String(valor || '').split(',');
  const ids = lista.map(Number).filter(n => Number.isInteger(n) && n > 0);
  return [...new Set(ids)];
}

/**
 * Busca os serviços ativos da clínica, na ordem pedida.
 * Retorna null se algum não existir/estiver inativo.
 */
async function buscarServicosAtivos(pool, clinicaId, ids) {
  if (ids.length === 0 || ids.length > MAX_SERVICOS_POR_ATENDIMENTO) return null;

  const request = pool.request().input('ClinicaId', sql.Int, clinicaId);
  ids.forEach((id, i) => request.input(`Id${i}`, sql.Int, id));

  const result = await request.query(`
    SELECT Id, Titulo, DuracaoMinutos, Preco
    FROM Servico
    WHERE ClinicaId = @ClinicaId
      AND Status = 'Ativo'
      AND Id IN (${ids.map((_, i) => `@Id${i}`).join(', ')})
  `);

  if (result.recordset.length !== ids.length) return null;

  const porId = new Map(result.recordset.map(s => [s.Id, s]));
  return ids.map(id => porId.get(id));
}

const duracaoTotal = servicos => servicos.reduce((total, s) => total + s.DuracaoMinutos, 0);

/**
 * Na remarcação (?remarcar=<id>), o horário atual da própria cliente
 * não conta como ocupado (ela pode só mudar alguns minutos).
 */
async function idsParaIgnorar(pool, req) {
  if (!req.query.remarcar) return [];

  const itens = await buscarItensAtendimento(pool, {
    agendamentoId: req.query.remarcar,
    clienteId: req.clienteId,
    clinicaId: req.clinicaId
  });

  return itens.filter(i => ATIVOS.includes(i.Status)).map(i => i.Id);
}

function respostaServicosInvalidos(res) {
  return res.status(404).json({
    sucesso: false,
    mensagem: `Escolha de 1 a ${MAX_SERVICOS_POR_ATENDIMENTO} serviços disponíveis`
  });
}

/**
 * =========================
 * REGRAS PARA A TELA DE AGENDAR
 * =========================
 */
async function obterConfiguracao(req, res) {
  try {
    const pool = await sql.connect();
    const janela = await obterJanelaAgendamento(pool, req.clinicaId);

    const result = await pool.request()
      .input('ClinicaId', sql.Int, req.clinicaId)
      .query(`
        SELECT c.PoliticaAgendamento, cfg.JanelaCancelamentoHoras, cfg.MultaPercentual
        FROM Clinica c
        LEFT JOIN ConfiguracaoClinica cfg ON cfg.ClinicaId = c.Id
        WHERE c.Id = @ClinicaId
      `);

    const dados = result.recordset[0] || {};

    res.set('Cache-Control', 'no-store');
    return res.json({
      sucesso: true,
      agendaLiberada: Boolean(janela),
      dataMinima: janela?.dataMinima || null,
      dataMaxima: janela?.dataMaxima || null,
      maxServicos: MAX_SERVICOS_POR_ATENDIMENTO,
      politicaAgendamento: dados.PoliticaAgendamento || null,
      janelaCancelamentoHoras: Number(dados.JanelaCancelamentoHoras || 0),
      multaPercentual: Number(dados.MultaPercentual || 0)
    });

  } catch (error) {
    console.error('Erro ao obter configuração da agenda (cliente):', error);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro ao carregar a agenda' });
  }
}

/**
 * =========================
 * DIAS COM HORÁRIO LIVRE (próximas 3 semanas)
 * =========================
 * ?servicoIds=1,2 → considera a soma das durações
 */
async function listarDias(req, res) {
  try {
    const pool = await sql.connect();
    const servicos = await buscarServicosAtivos(pool, req.clinicaId, lerServicoIds(req.query.servicoIds));

    if (!servicos) return respostaServicosInvalidos(res);

    const janela = await obterJanelaAgendamento(pool, req.clinicaId);
    if (!janela) {
      return res.json({ sucesso: true, dias: [] });
    }

    const datas = [];
    for (let i = 0; i < DIAS_EXIBIDOS; i++) {
      const data = somarDias(janela.dataMinima, i);
      if (data > janela.dataMaxima) break;
      datas.push(data);
    }

    const duracaoMinutos = duracaoTotal(servicos);
    const ignorarIds = await idsParaIgnorar(pool, req);

    // Calcula em paralelo (cada dia é independente)
    const dias = await Promise.all(datas.map(async data => {
      const horarios = await calcularHorariosLivres(pool, {
        clinicaId: req.clinicaId,
        data,
        duracaoMinutos,
        janela,
        ignorarIds
      });
      return { data, livres: horarios.length };
    }));

    res.set('Cache-Control', 'no-store');
    return res.json({ sucesso: true, dias });

  } catch (error) {
    console.error('Erro ao listar dias (cliente):', error);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro ao carregar os dias' });
  }
}

/**
 * =========================
 * HORÁRIOS LIVRES DE UM DIA
 * =========================
 * Horários em que TODOS os serviços escolhidos cabem em sequência
 */
async function listarHorarios(req, res) {
  const { data } = req.query;

  if (!DATA_VALIDA.test(data || '')) {
    return res.status(400).json({ sucesso: false, mensagem: 'Data inválida' });
  }

  try {
    const pool = await sql.connect();
    const servicos = await buscarServicosAtivos(pool, req.clinicaId, lerServicoIds(req.query.servicoIds));

    if (!servicos) return respostaServicosInvalidos(res);

    const horarios = await calcularHorariosLivres(pool, {
      clinicaId: req.clinicaId,
      data,
      duracaoMinutos: duracaoTotal(servicos),
      ignorarIds: await idsParaIgnorar(pool, req)
    });

    res.set('Cache-Control', 'no-store');
    return res.json({ sucesso: true, data, horarios });

  } catch (error) {
    console.error('Erro ao listar horários (cliente):', error);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro ao carregar os horários' });
  }
}

/**
 * =========================
 * CLIENTE CRIA O AGENDAMENTO
 * =========================
 * Body: { servicoIds: [1, 2], data, horaInicio }
 * Cada serviço vira um Agendamento CRIADO (aguardando confirmação),
 * Origem = CLIENTE, em sequência e com o mesmo GrupoAgendamento.
 */
async function criarAgendamento(req, res) {
  const { data, horaInicio } = req.body;
  const servicoIds = lerServicoIds(req.body.servicoIds);
  const clinicaId = req.clinicaId;
  const clienteId = req.clienteId;

  if (servicoIds.length === 0 || !DATA_VALIDA.test(data || '') || !HORA_VALIDA.test(horaInicio || '')) {
    return res.status(400).json({ sucesso: false, mensagem: 'Escolha o serviço, o dia e o horário' });
  }

  try {
    const pool = await sql.connect();

    const vinculo = await pool.request()
      .input('ClinicaId', sql.Int, clinicaId)
      .input('ClienteId', sql.Int, clienteId)
      .query(`
        SELECT Status FROM ClinicaCliente
        WHERE ClinicaId = @ClinicaId AND ClienteId = @ClienteId
      `);

    if (vinculo.recordset[0]?.Status !== 'Ativo') {
      return res.status(403).json({
        sucesso: false,
        mensagem: 'Seu cadastro está inativo. Fale conosco para agendar.'
      });
    }

    const servicos = await buscarServicosAtivos(pool, clinicaId, servicoIds);
    if (!servicos) return respostaServicosInvalidos(res);

    // Conta atendimentos (vários serviços juntos contam como um só)
    const abertos = await pool.request()
      .input('ClinicaId', sql.Int, clinicaId)
      .input('ClienteId', sql.Int, clienteId)
      .input('Hoje', sql.Date, agoraBrasil().data)
      .query(`
        SELECT COUNT(DISTINCT COALESCE(CONVERT(VARCHAR(36), GrupoAgendamento), CONVERT(VARCHAR(36), Id))) AS Total
        FROM Agendamento
        WHERE ClinicaId = @ClinicaId
          AND ClienteId = @ClienteId
          AND DataAgendamento >= @Hoje
          AND Status IN ('CRIADO', 'CONFIRMADO')
      `);

    if (abertos.recordset[0].Total >= MAX_ATENDIMENTOS_ABERTOS) {
      return res.status(409).json({
        sucesso: false,
        mensagem: `Você já tem ${MAX_ATENDIMENTOS_ABERTOS} atendimentos marcados. Para agendar mais, fale conosco.`
      });
    }

    const duracaoMinutos = duracaoTotal(servicos);

    const livres = await calcularHorariosLivres(pool, { clinicaId, data, duracaoMinutos });

    if (!livres.includes(horaInicio)) {
      return res.status(409).json({
        sucesso: false,
        codigo: 'HORARIO_INDISPONIVEL',
        mensagem: 'Esse horário acabou de ser ocupado. Escolha outro, por favor.'
      });
    }

    // Monta a sequência: cada serviço começa quando o anterior termina
    let cursor = paraMinutos(horaInicio);
    const itens = servicos.map(s => {
      const item = { servico: s, inicio: paraHora(cursor), fim: paraHora(cursor + s.DuracaoMinutos) };
      cursor += s.DuracaoMinutos;
      return item;
    });

    const horaFim = itens[itens.length - 1].fim;
    const grupo = itens.length > 1 ? crypto.randomUUID() : null;

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Revalida o período inteiro dentro da transação, com trava
      const conflito = await existeConflitoAgendamento(
        clinicaId, data, horaInicio, horaFim, new sql.Request(transaction)
      );

      if (conflito) {
        await transaction.rollback();
        return res.status(409).json({
          sucesso: false,
          codigo: 'HORARIO_INDISPONIVEL',
          mensagem: 'Esse horário acabou de ser ocupado. Escolha outro, por favor.'
        });
      }

      for (const item of itens) {
        await new sql.Request(transaction)
          .input('ClinicaId', sql.Int, clinicaId)
          .input('ServicoId', sql.Int, item.servico.Id)
          .input('ClienteId', sql.Int, clienteId)
          .input('DataAgendamento', sql.Date, data)
          .input('HoraInicio', sql.VarChar(8), item.inicio + ':00')
          .input('HoraFim', sql.VarChar(8), item.fim + ':00')
          .input('ValorServico', sql.Decimal(10, 2), item.servico.Preco)
          .input('Grupo', sql.UniqueIdentifier, grupo)
          .query(`
            INSERT INTO Agendamento
              (ClinicaId, ServicoId, ClienteId, DataAgendamento, HoraInicio, HoraFim,
               Status, ValorServico, Origem, GrupoAgendamento)
            VALUES
              (@ClinicaId, @ServicoId, @ClienteId, @DataAgendamento,
               CAST(@HoraInicio AS TIME), CAST(@HoraFim AS TIME),
               'CRIADO', @ValorServico, 'CLIENTE', @Grupo)
          `);
      }

      await transaction.commit();

    } catch (erroTransacao) {
      await transaction.rollback();
      throw erroTransacao;
    }

    return res.status(201).json({
      sucesso: true,
      agendamento: {
        grupo,
        data,
        horaInicio,
        horaFim,
        valorTotal: servicos.reduce((total, s) => total + Number(s.Preco), 0),
        status: 'CRIADO',
        servicos: itens.map(i => ({
          titulo: i.servico.Titulo,
          horaInicio: i.inicio,
          horaFim: i.fim,
          valor: Number(i.servico.Preco)
        }))
      }
    });

  } catch (error) {
    console.error('Erro ao criar agendamento (cliente):', error);
    return res.status(500).json({ sucesso: false, mensagem: 'Não foi possível agendar. Tente novamente.' });
  }
}

module.exports = {
  obterConfiguracao,
  listarDias,
  listarHorarios,
  criarAgendamento
};
