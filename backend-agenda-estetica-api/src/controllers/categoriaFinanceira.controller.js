const { sql } = require('../config/database')

async function listarCategorias(req, res) {
  try {

    const clinicaId = req.clinicaId

    const result = await sql.connect().then(pool =>
      pool.request()
        .input('ClinicaId', sql.Int, clinicaId)
        .query(`
          SELECT
            Id AS id,
            Nome AS nome,
            Status AS status
          FROM CategoriaFinanceira
          WHERE ClinicaId = @ClinicaId
          ORDER BY Nome
        `)
    )

    return res.json({
      sucesso: true,
      categorias: result.recordset
    })

  } catch (error) {

    console.error(error)

    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao listar categorias'
    })

  }
}

async function criarCategoria(req, res) {
  try {
   
    const clinicaId = req.clinicaId
    const { nome } = req.body
   
    if (!nome) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Nome obrigatório'
      })
    }

    const existente = await sql.connect().then(pool =>
      pool.request()
        .input('ClinicaId', sql.Int, clinicaId)
        .input('Nome', sql.VarChar(100), nome)
        .query(`
      SELECT Id
      FROM CategoriaFinanceira
      WHERE ClinicaId = @ClinicaId
        AND Nome = @Nome
    `)
    )

    if (existente.recordset.length > 0) {
      return res.status(409).json({
        sucesso: false,
        mensagem: 'Já existe uma categoria com este nome'
      })
    }

    await sql.connect().then(pool =>
      pool.request()
        .input('ClinicaId', sql.Int, clinicaId)
        .input('Nome', sql.VarChar(100), nome)
        .query(`
          INSERT INTO CategoriaFinanceira
          (
            ClinicaId,
            Nome
          )
          VALUES
          (
            @ClinicaId,
            @Nome
          )
        `)
    )

    return res.status(201).json({
      sucesso: true
    })

  } catch (error) {
    console.error(error)
    return res.status(500).json({
      sucesso: false
    })

  }
}

async function ativarCategoria(req, res) {
  try {

    const { id } = req.params

    await sql.connect().then(pool =>
      pool.request()
        .input('Id', sql.Int, Number(id))
        .query(`
          UPDATE CategoriaFinanceira
          SET Status = 'Ativo'
          WHERE Id = @Id
        `)
    )

    return res.json({
      sucesso: true
    })

  } catch (error) {

    console.error(error)

    return res.status(500).json({
      sucesso: false
    })

  }
}

async function desativarCategoria(req, res) {
  try {

    const { id } = req.params

    await sql.connect().then(pool =>
      pool.request()
        .input('Id', sql.Int, Number(id))
        .query(`
          UPDATE CategoriaFinanceira
          SET Status = 'Inativo'
          WHERE Id = @Id
        `)
    )

    return res.json({
      sucesso: true
    })

  } catch (error) {

    console.error(error)

    return res.status(500).json({
      sucesso: false
    })

  }
}

module.exports = {
  listarCategorias,
  criarCategoria,
  ativarCategoria,
  desativarCategoria
}