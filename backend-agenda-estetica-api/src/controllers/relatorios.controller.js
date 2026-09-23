const { sql } = require('../config/database');

/**
 * =========================
 * RELATÓRIO RESUMO DA CLÍNICA
 * =========================
 */
async function resumo(req, res) {
  try {
    if (req.userTipo !== 'clinica') {
      return res.status(403).json({ mensagem: 'Acesso negado' });
    }

    const { dataInicio, dataFim } = req.query;
    const clinicaId = req.clinicaId;

    if (!dataInicio || !dataFim) {
      return res.status(400).json({
        mensagem: 'dataInicio e dataFim são obrigatórios'
      });
    }

    const pool = await sql.connect();

    const result = await pool.request()
      .input('ClinicaId', sql.Int, clinicaId)
      .input('DataInicio', sql.Date, dataInicio)
      .input('DataFim', sql.Date, dataFim)
      .query(`
        SELECT
          COUNT(*) AS totalAtendimentos,
          COUNT(DISTINCT DataAgendamento) AS diasComAtendimento,
          SUM(DATEDIFF(MINUTE, HoraInicio, HoraFim)) / 60.0 AS horasTrabalhadas,
          SUM(ISNULL(ValorServico,0)) AS faturamento,
          SUM(ISNULL(ValorMulta,0)) AS totalMultas
        FROM Agendamento
        WHERE
          Status = 'FINALIZADO'
          AND ClinicaId = @ClinicaId
          AND DataAgendamento BETWEEN @DataInicio AND @DataFim
      `);

    const r = result.recordset[0];

    return res.json({
      totalAtendimentos: r.totalAtendimentos ?? 0,
      diasComAtendimento: r.diasComAtendimento ?? 0,
      horasTrabalhadas: r.horasTrabalhadas ?? 0,
      faturamento: r.faturamento ?? 0,
      totalMultas: r.totalMultas ?? 0
    });

  } catch (err) {
    console.error('Erro relatório resumo:', err);
    return res.status(500).json({ mensagem: 'Erro no relatório resumo' });
  }
}

/**
 * =========================
 * FATURAMENTO POR SERVIÇO
 * =========================
 */
async function faturamentoPorServico(req, res) {
  try {
    if (req.userTipo !== 'clinica') {
      return res.status(403).json({ mensagem: 'Acesso negado' });
    }

    const { dataInicio, dataFim } = req.query;
    const clinicaId = req.clinicaId;

    const pool = await sql.connect();

    const result = await pool.request()
      .input('ClinicaId', sql.Int, clinicaId)
      .input('DataInicio', sql.Date, dataInicio)
      .input('DataFim', sql.Date, dataFim)
      .query(`
        SELECT
          s.Titulo AS Servico,
          COUNT(*) AS TotalExecucoes,
          SUM(a.ValorServico) AS TotalFaturado
        FROM Agendamento a
        JOIN Servico s ON s.Id = a.ServicoId
        WHERE
          a.Status = 'FINALIZADO'
          AND a.ClinicaId = @ClinicaId
          AND a.DataAgendamento BETWEEN @DataInicio AND @DataFim
        GROUP BY s.Titulo
        ORDER BY TotalFaturado DESC
      `);

    return res.json(result.recordset);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ mensagem: 'Erro faturamento por serviço' });
  }
}

/**
 * =========================
 * MULTAS
 * =========================
 */
async function multas(req, res) {
  try {
    if (req.userTipo !== 'clinica') {
      return res.status(403).json({ mensagem: 'Acesso negado' });
    }

    const { dataInicio, dataFim } = req.query;
    const clinicaId = req.clinicaId;

    const pool = await sql.connect();

    const result = await pool.request()
      .input('ClinicaId', sql.Int, clinicaId)
      .input('DataInicio', sql.Date, dataInicio)
      .input('DataFim', sql.Date, dataFim)
      .query(`
        SELECT
          COUNT(*) AS CancelamentosComMulta,
          SUM(ValorMulta) AS TotalMultas
        FROM Agendamento
        WHERE
          Status = 'CANCELADO'
          AND ValorMulta IS NOT NULL
          AND ClinicaId = @ClinicaId
          AND DataAgendamento BETWEEN @DataInicio AND @DataFim
      `);

    return res.json(result.recordset[0]);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ mensagem: 'Erro relatório de multas' });
  }
}

/**
  * RELATÓRIO DE CLIENTES
======== * =========================
 */
async function relatorioClientes(req, res) {
  try {
    if (req.userTipo !== 'clinica') {
      return res.status(403).json({ mensagem: 'Acesso negado' });
    }

    const { dataInicio, dataFim, clienteId } = req.query;
    const clinicaId = req.clinicaId;

    if (!dataInicio || !dataFim) {
      return res.status(400).json({
        mensagem: 'dataInicio e dataFim são obrigatórios'
      });
    }

    const pool = await sql.connect();

    const result = await pool.request()
      .input('ClinicaId', sql.Int, clinicaId)
      .input('DataInicio', sql.Date, dataInicio)
      .input('DataFim', sql.Date, dataFim)
      .input('ClienteId', sql.Int, clienteId || null)
      .query(`
        SELECT
          c.Id AS ClienteId,
          c.Nome AS Cliente,
          COUNT(*) AS TotalProcedimentos,
          SUM(a.ValorServico) AS ValorGasto,
          COUNT(DISTINCT MONTH(a.DataAgendamento)) AS MesesAtivos
        FROM Agendamento a
        JOIN Cliente c ON c.Id = a.ClienteId
        WHERE
          a.Status = 'FINALIZADO'
          AND a.ClinicaId = @ClinicaId
          AND a.DataAgendamento BETWEEN @DataInicio AND @DataFim
          AND (@ClienteId IS NULL OR c.Id = @ClienteId)
        GROUP BY c.Id, c.Nome
        ORDER BY ValorGasto DESC
      `);

    const clientes = result.recordset.map(c => ({
      clienteId: c.ClienteId,
      cliente: c.Cliente,
      totalProcedimentos: c.TotalProcedimentos,
      valorGasto: c.ValorGasto ?? 0,
      frequenciaMedia:
        c.MesesAtivos > 0
          ? Number((c.TotalProcedimentos / c.MesesAtivos).toFixed(2))
          : 0
    }));

    return res.json(clientes);

  } catch (err) {
    console.error('Erro relatório clientes:', err);
    return res.status(500).json({
      mensagem: 'Erro ao gerar relatório de clientes'
    });
  }
}

/**
 * =========================
 * RESUMO DE DESPESAS
 * =========================
 */
async function resumoDespesas(req, res) {
  try {
    if (req.userTipo !== 'clinica') {
      return res.status(403).json({ mensagem: 'Acesso negado' });
    }

    const { dataInicio, dataFim } = req.query;
    const clinicaId = req.clinicaId;

    if (!dataInicio || !dataFim) {
      return res.status(400).json({
        mensagem: 'dataInicio e dataFim são obrigatórios'
      });
    }

    const pool = await sql.connect();

    const result = await pool.request()
      .input('ClinicaId', sql.Int, clinicaId)
      .input('DataInicio', sql.Date, dataInicio)
      .input('DataFim', sql.Date, dataFim)
      .query(`
        SELECT
          SUM(CASE WHEN Status = 'PAGO' THEN Valor ELSE 0 END) AS TotalPagas,
          SUM(CASE WHEN Status = 'PENDENTE' THEN Valor ELSE 0 END) AS TotalPendentes
        FROM Despesa
        WHERE
          ClinicaId = @ClinicaId
          AND Data BETWEEN @DataInicio AND @DataFim
      `);

    const r = result.recordset[0];

    return res.json({
      totalDespesasPagas: r.TotalPagas ?? 0,
      totalDespesasPendentes: r.TotalPendentes ?? 0
    });

  } catch (err) {
    console.error('Erro relatório despesas:', err);
    return res.status(500).json({
      mensagem: 'Erro ao gerar relatório de despesas'
    });
  }
}

/**
 * =========================
 * OBTER META
 * =========================
 */
async function obterMeta(req, res) {
  try {
    if (req.userTipo !== 'clinica') {
      return res.status(403).json({ mensagem: 'Acesso negado' });
    }

    const clinicaId = req.clinicaId;
    const pool = await sql.connect();

    const result = await pool.request()
      .input('ClinicaId', sql.Int, clinicaId)
      .query(`
        SELECT TOP 1 Valor
        FROM MetaFinanceira
        WHERE ClinicaId = @ClinicaId
        ORDER BY Id DESC
      `);

    const meta = result.recordset[0];

    return res.json({
      valor: meta ? meta.Valor : 0
    });

  } catch (err) {
    console.error('Erro ao buscar meta:', err);
    return res.status(500).json({ mensagem: 'Erro ao buscar meta' });
  }
}

/**
 * =========================
 * SALVAR META
 * =========================
 */
async function salvarMeta(req, res) {
  try {
    if (req.userTipo !== 'clinica') {
      return res.status(403).json({ mensagem: 'Acesso negado' });
    }

    const { valor } = req.body;
    const clinicaId = req.clinicaId;

    if (!valor) {
      return res.status(400).json({ mensagem: 'Valor é obrigatório' });
    }

    const pool = await sql.connect();

    await pool.request()
      .input('ClinicaId', sql.Int, clinicaId)
      .input('Valor', sql.Decimal(10, 2), valor)
      .query(`
        INSERT INTO MetaFinanceira (ClinicaId, Valor)
        VALUES (@ClinicaId, @Valor)
      `);

    return res.json({ sucesso: true });

  } catch (err) {
    console.error('Erro ao salvar meta:', err);
    return res.status(500).json({ mensagem: 'Erro ao salvar meta' });
  }
}

/**
 * =========================
 * FECHAR MÊS
 * =========================
 */
async function fecharMes(req, res) {
  try {
    if (req.userTipo !== 'clinica') {
      return res.status(403).json({ mensagem: 'Acesso negado' });
    }

    const { dataInicio, dataFim } = req.body;
    const clinicaId = req.clinicaId;

    if (!dataInicio || !dataFim) {
      return res.status(400).json({
        mensagem: 'dataInicio e dataFim são obrigatórios'
      });
    }

    const pool = await sql.connect();

    // ✅ Verifica se já existe fechamento
    const existe = await pool.request()
      .input('ClinicaId', sql.Int, clinicaId)
      .input('DataInicio', sql.Date, dataInicio)
      .input('DataFim', sql.Date, dataFim)
      .query(`
        SELECT 1
        FROM FechamentoMensal
        WHERE
          ClinicaId = @ClinicaId
          AND DataInicio = @DataInicio
          AND DataFim = @DataFim
      `);

    if (existe.recordset.length > 0) {
      return res.status(400).json({
        mensagem: 'Este período já está fechado'
      });
    }

    // ✅ Insere fechamento
    await pool.request()
      .input('ClinicaId', sql.Int, clinicaId)
      .input('DataInicio', sql.Date, dataInicio)
      .input('DataFim', sql.Date, dataFim)
      .query(`
        INSERT INTO FechamentoMensal (ClinicaId, DataInicio, DataFim)
        VALUES (@ClinicaId, @DataInicio, @DataFim)
      `);

    return res.json({ sucesso: true });

  } catch (err) {
    console.error('Erro ao fechar mês:', err);
    return res.status(500).json({
      mensagem: 'Erro ao fechar mês'
    });
  }
}

/**
 * =========================
 * REABRIR MÊS
 * =========================
 */
async function reabrirMes(req, res) {
  try {

    if (req.userTipo !== 'clinica') {
      return res.status(403).json({
        mensagem: 'Acesso negado'
      });
    }

    const { id } = req.params;
    const clinicaId = req.clinicaId;

    const pool = await sql.connect();

    const result = await pool.request()
      .input('Id', sql.Int, Number(id))
      .input('ClinicaId', sql.Int, clinicaId)
      .query(`
        DELETE FROM FechamentoMensal
        WHERE
          Id = @Id
          AND ClinicaId = @ClinicaId
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        mensagem: 'Fechamento não encontrado'
      });
    }

    return res.json({
      sucesso: true,
      mensagem: 'Período reaberto com sucesso'
    });

  } catch (err) {

    console.error(
      'Erro ao reabrir período:',
      err
    );

    return res.status(500).json({
      mensagem: 'Erro ao reabrir período'
    });

  }
}


/**
 * =========================
 * STATUS DO MÊS
 * =========================
 */
async function statusMes(req, res) {
  try {
    if (req.userTipo !== 'clinica') {
      return res.status(403).json({ mensagem: 'Acesso negado' });
    }

    const { dataInicio, dataFim } = req.query;
    const clinicaId = req.clinicaId;

    const pool = await sql.connect();

    const result = await pool.request()
      .input('ClinicaId', sql.Int, clinicaId)
      .input('DataInicio', sql.Date, dataInicio)
      .input('DataFim', sql.Date, dataFim)
      .query(`
        SELECT 1
        FROM FechamentoMensal
        WHERE
          ClinicaId = @ClinicaId
          AND DataInicio = @DataInicio
          AND DataFim = @DataFim
      `);

    return res.json({
      fechado: result.recordset.length > 0
    });

  } catch (err) {
    console.error('Erro status mês:', err);
    return res.status(500).json({
      mensagem: 'Erro ao verificar status'
    });
  }
}

/**
 * =========================
 * COMPARAÇÃO DE PERÍODO (NOVO)
 * =========================
 */
async function comparacaoPeriodo(req, res) {
  try {
    if (req.userTipo !== 'clinica') {
      return res.status(403).json({ mensagem: 'Acesso negado' });
    }

    const { dataInicio, dataFim } = req.query;
    const clinicaId = req.clinicaId;

    if (!dataInicio || !dataFim) {
      return res.status(400).json({
        mensagem: 'dataInicio e dataFim são obrigatórios'
      });
    }

    const inicioAtual = new Date(dataInicio);
    const fimAtual = new Date(dataFim);

    // ✅ calcula diferença de dias
    const dias = Math.ceil((fimAtual - inicioAtual) / (1000 * 60 * 60 * 24));

    const inicioAnterior = new Date(inicioAtual);
    inicioAnterior.setDate(inicioAnterior.getDate() - dias);

    const fimAnterior = new Date(inicioAtual);
    fimAnterior.setDate(fimAnterior.getDate() - 1);

    const pool = await sql.connect();

    // ✅ PERÍODO ATUAL
    const atualResult = await pool.request()
      .input('ClinicaId', sql.Int, clinicaId)
      .input('DataInicio', sql.Date, dataInicio)
      .input('DataFim', sql.Date, dataFim)
      .query(`
        SELECT
          SUM(ISNULL(ValorServico,0)) + SUM(ISNULL(ValorMulta,0)) AS faturamento
        FROM Agendamento
        WHERE
          Status = 'FINALIZADO'
          AND ClinicaId = @ClinicaId
          AND DataAgendamento BETWEEN @DataInicio AND @DataFim
      `);

    // ✅ PERÍODO ANTERIOR
    const anteriorResult = await pool.request()
      .input('ClinicaId', sql.Int, clinicaId)
      .input('DataInicio', sql.Date, inicioAnterior)
      .input('DataFim', sql.Date, fimAnterior)
      .query(`
        SELECT
          SUM(ISNULL(ValorServico,0)) + SUM(ISNULL(ValorMulta,0)) AS faturamento
        FROM Agendamento
        WHERE
          Status = 'FINALIZADO'
          AND ClinicaId = @ClinicaId
          AND DataAgendamento BETWEEN @DataInicio AND @DataFim
      `);

    const faturamentoAtual = atualResult.recordset[0]?.faturamento || 0;
    const faturamentoAnterior = anteriorResult.recordset[0]?.faturamento || 0;

    let crescimento = 0;

    if (faturamentoAnterior > 0) {
      crescimento =
        ((faturamentoAtual - faturamentoAnterior) / faturamentoAnterior) * 100;
    }

    return res.json({
      faturamentoAtual,
      faturamentoAnterior,
      crescimento
    });

  } catch (err) {
    console.error('Erro comparacaoPeriodo:', err);
    return res.status(500).json({
      mensagem: 'Erro ao calcular comparação de período'
    });
  }
}

/**
 * =========================
 * DESPESAS POR CATEGORIA
 * =========================
 */
async function despesasPorCategoria(req, res) {
  try {

    if (req.userTipo !== 'clinica') {
      return res.status(403).json({
        mensagem: 'Acesso negado'
      })
    }

    const { dataInicio, dataFim } = req.query

    const clinicaId = req.clinicaId

    if (!dataInicio || !dataFim) {
      return res.status(400).json({
        mensagem:
          'dataInicio e dataFim são obrigatórios'
      })
    }

    const pool = await sql.connect()

    const result = await pool.request()
      .input(
        'ClinicaId',
        sql.Int,
        clinicaId
      )
      .input(
        'DataInicio',
        sql.Date,
        dataInicio
      )
      .input(
        'DataFim',
        sql.Date,
        dataFim
      )
      .query(`
        SELECT

          ISNULL(
            cf.Nome,
            'Sem Categoria'
          ) AS Categoria,

          SUM(d.Valor) AS Total

        FROM Despesa d

        LEFT JOIN CategoriaFinanceira cf
          ON cf.Id =
          d.CategoriaFinanceiraId

        WHERE
          d.ClinicaId = @ClinicaId

          AND d.Data BETWEEN
            @DataInicio
            AND
            @DataFim

        GROUP BY cf.Nome

        ORDER BY Total DESC
      `)

    return res.json(
      result.recordset
    )

  } catch (err) {

    console.error(err)

    return res.status(500).json({
      mensagem:
        'Erro ao gerar relatório'
    })

  }
}

/**
 * =========================
 * INDICADORES DE CLIENTES
 * (novos clientes + taxa de retorno)
 * =========================
 */
async function indicadoresClientes(req, res) {
  try {
    if (req.userTipo !== 'clinica') {
      return res.status(403).json({ mensagem: 'Acesso negado' });
    }

    const { dataInicio, dataFim } = req.query;
    const clinicaId = req.clinicaId;

    if (!dataInicio || !dataFim) {
      return res.status(400).json({
        mensagem: 'dataInicio e dataFim são obrigatórios'
      });
    }

    const pool = await sql.connect();

    const result = await pool.request()
      .input('ClinicaId', sql.Int, clinicaId)
      .input('DataInicio', sql.Date, dataInicio)
      .input('DataFim', sql.Date, dataFim)
      .query(`
        ;WITH ClientesPeriodo AS (
          SELECT DISTINCT a.ClienteId
          FROM Agendamento a
          WHERE a.Status = 'FINALIZADO'
            AND a.ClinicaId = @ClinicaId
            AND a.DataAgendamento BETWEEN @DataInicio AND @DataFim
        ),
        PrimeiroAtendimento AS (
          SELECT ClienteId, MIN(DataAgendamento) AS PrimeiraData
          FROM Agendamento
          WHERE Status = 'FINALIZADO'
            AND ClinicaId = @ClinicaId
          GROUP BY ClienteId
        )
        SELECT
          COUNT(*) AS TotalClientesPeriodo,
          SUM(CASE WHEN pa.PrimeiraData BETWEEN @DataInicio AND @DataFim THEN 1 ELSE 0 END) AS NovosClientes,
          SUM(CASE WHEN pa.PrimeiraData < @DataInicio THEN 1 ELSE 0 END) AS ClientesRecorrentes
        FROM ClientesPeriodo cp
        JOIN PrimeiroAtendimento pa ON pa.ClienteId = cp.ClienteId
      `);

    const r = result.recordset[0];

    const totalClientesPeriodo = r.TotalClientesPeriodo ?? 0;
    const novosClientes = r.NovosClientes ?? 0;
    const clientesRecorrentes = r.ClientesRecorrentes ?? 0;

    const taxaRetorno =
      totalClientesPeriodo > 0
        ? Number(((clientesRecorrentes / totalClientesPeriodo) * 100).toFixed(1))
        : 0;

    return res.json({
      novosClientes,
      clientesRecorrentes,
      taxaRetorno
    });

  } catch (err) {
    console.error('Erro indicadores de clientes:', err);
    return res.status(500).json({
      mensagem: 'Erro ao gerar indicadores de clientes'
    });
  }
}

/**
 * =========================
 * SÉRIE DE FATURAMENTO (por dia)
 * =========================
 */
async function serieFaturamento(req, res) {
  try {
    if (req.userTipo !== 'clinica') {
      return res.status(403).json({ mensagem: 'Acesso negado' });
    }

    const { dataInicio, dataFim } = req.query;
    const clinicaId = req.clinicaId;

    if (!dataInicio || !dataFim) {
      return res.status(400).json({
        mensagem: 'dataInicio e dataFim são obrigatórios'
      });
    }

    const pool = await sql.connect();

    const result = await pool.request()
      .input('ClinicaId', sql.Int, clinicaId)
      .input('DataInicio', sql.Date, dataInicio)
      .input('DataFim', sql.Date, dataFim)
      .query(`
        SELECT
          CONVERT(varchar(10), DataAgendamento, 23) AS Data,
          SUM(ISNULL(ValorServico,0)) + SUM(ISNULL(ValorMulta,0)) AS Valor
        FROM Agendamento
        WHERE
          Status = 'FINALIZADO'
          AND ClinicaId = @ClinicaId
          AND DataAgendamento BETWEEN @DataInicio AND @DataFim
        GROUP BY CONVERT(varchar(10), DataAgendamento, 23)
        ORDER BY Data
      `);

    return res.json(result.recordset);

  } catch (err) {
    console.error('Erro série de faturamento:', err);
    return res.status(500).json({
      mensagem: 'Erro ao gerar série de faturamento'
    });
  }
}

/**
 * =========================
 * HISTÓRICO DE FECHAMENTOS
 * =========================
 */
async function listarFechamentos(req, res) {
  try {

    if (req.userTipo !== 'clinica') {
      return res.status(403).json({
        mensagem: 'Acesso negado'
      });
    }

    const clinicaId = req.clinicaId;

    const pool = await sql.connect();

    const result = await pool.request()
      .input(
        'ClinicaId',
        sql.Int,
        clinicaId
      )
      .query(`
        SELECT
          Id,
          DataInicio,
          DataFim,
          CriadoEm
        FROM FechamentoMensal
        WHERE ClinicaId = @ClinicaId
        ORDER BY CriadoEm DESC
      `);

    return res.json(
      result.recordset
    );

  } catch (err) {

    console.error(
      'Erro ao listar fechamentos:',
      err
    );

    return res.status(500).json({
      mensagem:
        'Erro ao listar fechamentos'
    });

  }
}


module.exports = {
  resumo,
  faturamentoPorServico,
  multas,
  relatorioClientes,
  resumoDespesas,
  despesasPorCategoria,
  obterMeta,
  salvarMeta,
  fecharMes,
  reabrirMes,
  statusMes,
  listarFechamentos,
  comparacaoPeriodo,
  indicadoresClientes,
  serieFaturamento
};