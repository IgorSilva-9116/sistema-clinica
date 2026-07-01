const { sql } = require('../config/database')

/**
 * =========================
 * ENTRAR NA LISTA DE ESPERA
 * =========================
 */
async function entrarListaEspera(req, res) {
  try {
    const clinicaId = req.clinicaId
    const { clienteId, servicoId, dataAgendamento, horaDesejada } = req.body

    if (!clienteId || !servicoId || !dataAgendamento || !horaDesejada) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Dados obrigatórios não informados'
      })
    }

    const pool = await sql.connect()

    // ✅ VERIFICAR DUPLICIDADE
    const existe = await pool.request()
      .input('ClinicaId', sql.Int, clinicaId)
      .input('ClienteId', sql.Int, clienteId)
      .input('ServicoId', sql.Int, servicoId)
      .input('DataAgendamento', sql.Date, dataAgendamento)
      .input('HoraDesejada', sql.VarChar(5), horaDesejada)
      .query(`
        SELECT 1
        FROM ListaEspera
        WHERE ClinicaId = @ClinicaId
         AND ClienteId = @ClienteId
         AND ServicoId = @ServicoId
         AND DataAgendamento = @DataAgendamento
         AND HoraDesejada = @HoraDesejada
         AND Status = 'Ativo'
    `);

   if (existe.recordset.length > 0) {
    return res.status(400).json({
     sucesso: false,
     mensagem: 'Cliente já está na lista para esse horário'
    });
}
    
    await pool.request()
      .input('ClinicaId', sql.Int, clinicaId)
      .input('ClienteId', sql.Int, clienteId)
      .input('ServicoId', sql.Int, servicoId)
      .input('DataAgendamento', sql.Date, dataAgendamento)
      .input('HoraDesejada', sql.VarChar(5), horaDesejada)
      .query(`
        INSERT INTO ListaEspera
        (ClinicaId, ClienteId, ServicoId, DataAgendamento, HoraDesejada)
        VALUES
        (@ClinicaId, @ClienteId, @ServicoId, @DataAgendamento, @HoraDesejada)
      `)

    return res.json({
      sucesso: true,
      mensagem: 'Cliente adicionado na lista de espera'
    })

  } catch (error) {
    console.error(error)
    return res.status(500).json({ mensagem: 'Erro ao entrar na lista' })
  }
}


/**
 * =========================
 * LISTAR LISTA DE ESPERA
 * =========================
 */
async function listarLista(req, res) {
  try {
    const clinicaId = req.clinicaId

    const result = await sql.connect().then(pool =>
  pool.request()
    .input('ClinicaId', sql.Int, clinicaId)
    .query(`
      SELECT 
        le.Id,
        le.DataAgendamento,
        CONVERT(VARCHAR(10), le.DataAgendamento, 103) AS DataFormatada,
        le.HoraDesejada,
        c.Nome AS Cliente,
        s.Titulo AS Servico
      FROM ListaEspera le
      JOIN Cliente c ON c.Id = le.ClienteId
      JOIN Servico s ON s.Id = le.ServicoId
      WHERE le.ClinicaId = @ClinicaId
        AND le.Status = 'Ativo'
      ORDER BY le.DataAgendamento, le.HoraDesejada
    `)
);


    return res.json({
      sucesso: true,
      lista: result.recordset
    })

  } catch (error) {
    console.error(error)
    return res.status(500).json({ mensagem: 'Erro ao listar' })
  }
}


/**
 * =========================
 * REMOVER DA LISTA (AGENDOU)
 * =========================
 */
async function removerLista(req, res) {
  try {
    const { id } = req.params

    await sql.connect().then(pool =>
      pool.request()
        .input('Id', sql.Int, Number(id))
        .query(`
          UPDATE ListaEspera
          SET Status = 'Finalizado'
          WHERE Id = @Id
        `)
    )

    return res.json({
      sucesso: true
    })

  } catch (error) {
    console.error(error)
    return res.status(500).json({ mensagem: 'Erro ao remover' })
  }
}

module.exports = {
  entrarListaEspera,
  listarLista,
  removerLista
}