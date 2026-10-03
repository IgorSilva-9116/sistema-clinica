const { sql } = require('../config/database');
const { obterBlocosEfetivosDia } = require('../utils/blocosEfetivosDia');
const { gerarSlots } = require('../utils/gerarSlots');

/**
 * =========================
 * DISPONIBILIDADE REAL
 * =========================
 */
async function listarDisponibilidade(req, res) {
  try {
    const clinicaId = req.clinicaId;
    const { data, servicoId } = req.query;

    const jsDate = new Date(data + 'T00:00:00');

    if (!data || !servicoId) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Data e serviço são obrigatórios'
      });
    }

    // 1️⃣ Buscar duração do serviço
    const servicoResult = await sql.connect().then(pool =>
      pool.request()
        .input('ServicoId', sql.Int, Number(servicoId))
        .input('ClinicaId', sql.Int, clinicaId)
        .query(`
          SELECT DuracaoMinutos
          FROM Servico
          WHERE Id = @ServicoId
            AND ClinicaId = @ClinicaId
            AND Status = 'Ativo'
        `)
    );

    if (servicoResult.recordset.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Serviço não encontrado ou inativo'
      });
    }

    const duracaoMinutos = servicoResult.recordset[0].DuracaoMinutos;

    // 🔒 CONFIGURAÇÃO DA AGENDA
    const configResult = await sql.connect().then(pool =>
      pool.request()
        .input('ClinicaId', sql.Int, clinicaId)
        .query(`
          SELECT DataLimiteAgenda, DataFechamentoAgenda
          FROM ConfiguracaoClinica
          WHERE ClinicaId = @ClinicaId
        `)
    );

    const config = configResult.recordset[0];
    const dataAtual = new Date(data + 'T00:00:00');

    // 🔒 BLOQUEIO (voltar atrás)
    // Datas até o fechamento ficam fechadas para novos agendamentos
    if (config?.DataFechamentoAgenda) {
      const fechamento = new Date(config.DataFechamentoAgenda).toISOString().slice(0, 10);

      if (data <= fechamento) {

        return res
          .set('Cache-Control', 'no-store')
          .json({
            sucesso: true,
            data,
            servicoId,
            duracaoMinutos,
            aberto: false,
            horariosDisponiveis: []
          });
      }
    }

    // 🔒 LIMITE FUTURO
    if (config?.DataLimiteAgenda) {
      const limite = new Date(config.DataLimiteAgenda + 'T00:00:00');

      if (dataAtual > limite) {
        return res
          .set('Cache-Control', 'no-store')
          .json({
            sucesso: true,
            data,
            servicoId,
            duracaoMinutos,
            aberto: false,
            horariosDisponiveis: []
          });
      }
    }

    // 2️⃣ Agenda base + exceções
    const resultadoDia = await obterBlocosEfetivosDia(clinicaId, data);

    console.log(
      'RESULTADO DIA:',
      resultadoDia
    );

    if (!resultadoDia.aberto) {
      return res
        .set('Cache-Control', 'no-store')
        .json({
          sucesso: true,
          data,
          servicoId,
          duracaoMinutos,
          aberto: false,
          horariosDisponiveis: []
        });
    }

    // 3️⃣ Gerar slots
    const horariosDisponiveis = gerarSlots(
      resultadoDia.blocos,
      duracaoMinutos
    );


    console.log(
      'RESULTADO DIA FINAL:',
      resultadoDia
    );


    // ✅ ✅ CORREÇÃO PRINCIPAL
    return res
      .set('Cache-Control', 'no-store')
      .json({
        sucesso: true,
        data,
        servicoId,
        duracaoMinutos,
        aberto: true, // ✅ AGORA SEMPRE VEM
        horariosDisponiveis,
        blocos: resultadoDia.blocos
      });

  } catch (error) {
    console.error('Erro ao listar disponibilidade:', error);
    return res
      .set('Cache-Control', 'no-store')
      .status(500)
      .json({
        sucesso: false,
        mensagem: 'Erro ao calcular disponibilidade'
      });
  }
}

module.exports = {
  listarDisponibilidade
};
