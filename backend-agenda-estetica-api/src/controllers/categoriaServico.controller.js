const { sql } = require('../config/database')

/**
 * =========================
 * LISTAR CATEGORIAS
 * =========================
 */
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
         FROM CategoriaServico
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

/**
 * =========================
 * CRIAR CATEGORIA
 * =========================
 */
async function criarCategoria(req, res) {
  try {
    const clinicaId = req.clinicaId
    const { nome } = req.body

    if (!nome) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Nome é obrigatório'
      })
    }

    await sql.connect().then(pool =>
      pool.request()
        .input('ClinicaId', sql.Int, clinicaId)
        .input('Nome', sql.VarChar(100), nome)
        .query(`
          INSERT INTO CategoriaServico
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
      sucesso: true,
      mensagem: 'Categoria criada com sucesso'
    })

  } catch (error) {
    console.error(error)

    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao criar categoria'
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
          UPDATE CategoriaServico
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
      sucesso: false,
      mensagem: 'Erro ao desativar categoria'
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
          UPDATE CategoriaServico
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
      sucesso: false,
      mensagem: 'Erro ao ativar categoria'
    })
  }
}

module.exports = {
  listarCategorias,
  criarCategoria,
  ativarCategoria,
  desativarCategoria
}