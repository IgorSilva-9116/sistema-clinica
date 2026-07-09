const { sql } = require('../config/database');

/**
 * =========================
 * VERIFICA SE O PERÍODO ESTÁ FECHADO
 * =========================
 */
async function verificarPeriodoFechado(
  clinicaId,
  data
) {

  const pool = await sql.connect()

  const result =
    await pool.request()
      .input(
        'ClinicaId',
        sql.Int,
        clinicaId
      )
      .input(
        'Data',
        sql.Date,
        data
      )
      .query(`
        SELECT 1
        FROM FechamentoMensal
        WHERE
          ClinicaId = @ClinicaId
          AND @Data BETWEEN
            DataInicio
            AND DataFim
      `)

  return (
    result.recordset.length > 0
  )
}

/**
 * =========================
 * CRIAR DESPESA
 * =========================
 */
async function criarDespesa(req, res) {
  try {
    const clinicaId = req.clinicaId;

    // ✅ CORRIGIDO PARA PASCALCASE
    const {
      Descricao,
      Valor,
      Data,
      CategoriaFinanceiraId,
      FormaPagamento,
      Observacao,
      Status
    } = req.body;

    // ✅ VALIDAÇÃO CORRETA
    if (!Descricao || !Valor || !Data) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Descrição, valor e data são obrigatórios'
      });
    }

    const pool = await sql.connect();

    const periodoFechado =
       await verificarPeriodoFechado(
         clinicaId,
         Data
        )

      if (periodoFechado) {

      return res.status(400).json({
        sucesso: false,
        mensagem:
         'Não é possível cadastrar despesas em um período fechado'
      })

    }

    await pool.request()
      .input('ClinicaId', sql.Int, clinicaId)
      .input('Descricao', sql.VarChar(255), Descricao)
      .input('Valor', sql.Decimal(10,2), Valor)
      .input('Data', sql.Date, Data)
      .input('CategoriaFinanceiraId', sql.Int, CategoriaFinanceiraId || null)
      .input('FormaPagamento', sql.VarChar(50), FormaPagamento || null)
      .input('Observacao', sql.VarChar(500), Observacao || null)
      .input('Status', sql.VarChar(20), Status || 'PAGO')
      .query(`
        INSERT INTO Despesa
        (ClinicaId, Descricao, Valor, Data, CategoriaFinanceiraId, FormaPagamento, Observacao, Status)
        VALUES
        (@ClinicaId, @Descricao, @Valor, @Data, @CategoriaFinanceiraId, @FormaPagamento, @Observacao, @Status)
      `);

    return res.status(201).json({
      sucesso: true,
      mensagem: 'Despesa cadastrada com sucesso'
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao criar despesa'
    });
  }
}


/**
 * =========================
 * LISTAR DESPESAS
 * =========================
 */
async function listarDespesas(req, res) {
  try {

    const clinicaId = req.clinicaId
    const { dataInicio, dataFim } = req.query

    const pool = await sql.connect()

    const result = await pool.request()
      .input('ClinicaId', sql.Int, clinicaId)
      .input('DataInicio', sql.Date, dataInicio || null)
      .input('DataFim', sql.Date, dataFim || null)
      .query(`
        SELECT
          d.*,
          cf.Id AS CategoriaFinanceiraId,
          cf.Nome AS CategoriaFinanceira
        FROM Despesa d
        LEFT JOIN CategoriaFinanceira cf
          ON cf.Id = d.CategoriaFinanceiraId
        WHERE d.ClinicaId = @ClinicaId
          AND (
            @DataInicio IS NULL
            OR d.Data >= @DataInicio
          )
          AND (
            @DataFim IS NULL
            OR d.Data < DATEADD(DAY, 1, @DataFim)
          )
        ORDER BY d.Data DESC
      `)

    return res.json({
      sucesso: true,
      despesas: result.recordset
    })

  } catch (err) {

    console.error(err)

    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao listar despesas'
    })

  }
}

/**
 * =========================
 * EDITAR DESPESA
 * =========================
 */
async function editarDespesa(req, res) {
  try {

    const { id } = req.params
    const clinicaId = req.clinicaId

    const {
      Descricao,
      Valor,
      Data,
      CategoriaFinanceiraId,
      FormaPagamento,
      Observacao,
      Status
    } = req.body

    const periodoFechado =
      await verificarPeriodoFechado(
        clinicaId,
        Data
      )

      if (periodoFechado) {

      return res.status(400).json({
        sucesso: false,
        mensagem:
          'Não é possível editar despesas de um período fechado'
      })

    }

    const pool = await sql.connect()

    const result = await pool.request()
      .input('Id', sql.Int, Number(id))
      .input('ClinicaId', sql.Int, clinicaId)

      .input('Descricao', sql.VarChar(255), Descricao)
      .input('Valor', sql.Decimal(10, 2), Valor)
      .input('Data', sql.Date, Data)

      .input(
        'CategoriaFinanceiraId',
        sql.Int,
        CategoriaFinanceiraId || null
      )

      .input(
        'FormaPagamento',
        sql.VarChar(50),
        FormaPagamento || null
      )

      .input(
        'Observacao',
        sql.VarChar(500),
        Observacao || null
      )

      .input(
        'Status',
        sql.VarChar(20),
        Status || 'PENDENTE'
      )

      .query(`
        UPDATE Despesa
        SET
          Descricao = @Descricao,
          Valor = @Valor,
          Data = @Data,
          CategoriaFinanceiraId =
            @CategoriaFinanceiraId,
          FormaPagamento =
            @FormaPagamento,
          Observacao = @Observacao,
          Status = @Status

        WHERE
          Id = @Id
          AND ClinicaId = @ClinicaId
      `)

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem:
          'Despesa não encontrada'
      })
    }

    return res.json({
      sucesso: true,
      mensagem:
        'Despesa atualizada com sucesso'
    })

  } catch (err) {

    console.error(err)

    return res.status(500).json({
      sucesso: false,
      mensagem:
        'Erro ao atualizar despesa'
    })

  }
}


/**
 * =========================
 * EXCLUIR DESPESA
 * =========================
 */
async function excluirDespesa(req, res) {
  try {
    const { id } = req.params;
    const clinicaId = req.clinicaId;

    const pool = await sql.connect();

      // Busca a despesa para descobrir a data
    const despesa = await pool.request()
      .input('Id', sql.Int, Number(id))
      .input('ClinicaId', sql.Int, clinicaId)
      .query(`
        SELECT Data
        FROM Despesa
        WHERE
          Id = @Id
          AND ClinicaId = @ClinicaId
     `)

     if (despesa.recordset.length === 0) {

       return res.status(404).json({
         sucesso: false,
         mensagem: 'Despesa não encontrada'
        })

      }

     const periodoFechado =
       await verificarPeriodoFechado(
         clinicaId,
         despesa.recordset[0].Data
        )

      if (periodoFechado) {

      return res.status(400).json({
        sucesso: false,
        mensagem:
          'Não é possível excluir despesas de um período fechado'
      })

    } 

    const result = await pool.request()
      .input('Id', sql.Int, Number(id))
      .input('ClinicaId', sql.Int, clinicaId)
      .query(`
        DELETE FROM Despesa
        WHERE Id = @Id AND ClinicaId = @ClinicaId
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Despesa não encontrada'
      });
    }

    return res.json({
      sucesso: true,
      mensagem: 'Despesa removida com sucesso'
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao excluir despesa'
    });
  }
}

/**
 * =========================
 * MARCAR PAGO
 * =========================
 */
async function marcarComoPago(req, res) {
  try {
    const { id } = req.params;
    const clinicaId = req.clinicaId;

    const pool = await sql.connect();

      // Busca a data da despesa
    const despesa = await pool.request()
      .input('Id', sql.Int, id)
      .input('ClinicaId', sql.Int, clinicaId)
      .query(`
        SELECT Data
        FROM Despesa
        WHERE
         Id = @Id
         AND ClinicaId = @ClinicaId
     `)
     
    if (despesa.recordset.length === 0) {

      return res.status(404).json({
         sucesso: false,
         mensagem: 'Despesa não encontrada'
        })
    }

    const periodoFechado =
      await verificarPeriodoFechado(
        clinicaId,
        despesa.recordset[0].Data
      )

    if (periodoFechado) {

      return res.status(400).json({
        sucesso: false,
        mensagem:
          'Não é possível alterar despesas de um período fechado'
      })

    }

    await pool.request()
      .input('Id', sql.Int, id)
      .input('ClinicaId', sql.Int, clinicaId)
      .query(`
        UPDATE Despesa
        SET Status = 'PAGO'
        WHERE Id = @Id AND ClinicaId = @ClinicaId
      `);

    res.json({ sucesso: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ sucesso: false });
  }
}

module.exports = {
  criarDespesa,
  listarDespesas,
  editarDespesa,
  excluirDespesa,
  marcarComoPago
};
