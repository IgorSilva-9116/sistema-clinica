const { sql } = require('../config/database');
const bcrypt = require('bcrypt');

/* =====================================================
   USUÁRIOS CLIENTE
===================================================== */
async function criarUsuarioCliente(req, res) {
  try {
    const { clienteId, email, senha, nome } = req.body;

    if (!clienteId || !email || !senha) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Cliente, email e senha são obrigatórios'
      });
    }

    const clienteResult = await sql.connect().then(pool =>
      pool.request()
        .input('ClienteId', sql.Int, clienteId)
        .query(`SELECT Id FROM Cliente WHERE Id = @ClienteId`)
    );

    if (clienteResult.recordset.length === 0) {
      return res.status(404).json({ mensagem: 'Cliente não encontrado' });
    }

    const vinculoResult = await sql.connect().then(pool =>
      pool.request()
        .input('ClienteId', sql.Int, clienteId)
        .input('ClinicaId', sql.Int, req.clinicaId)
        .query(`
          SELECT Id FROM ClinicaCliente
          WHERE ClienteId = @ClienteId
            AND ClinicaId = @ClinicaId
            AND Status = 'Ativo'
        `)
    );

    if (vinculoResult.recordset.length === 0) {
      return res.status(403).json({
        mensagem: 'Cliente não possui vínculo ativo com esta clínica'
      });
    }

    const existente = await sql.connect().then(pool =>
      pool.request()
        .input('Email', sql.VarChar(150), email)
        .query(`SELECT Id FROM Usuario WHERE Email = @Email`)
    );

    if (existente.recordset.length > 0) {
      return res.status(409).json({ mensagem: 'Email já cadastrado' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    // ✅ CORREÇÃO: PrecisaTrocarSenha = 1
    await sql.connect().then(pool =>
      pool.request()
        .input('Nome', sql.VarChar(150), nome || '')
        .input('Email', sql.VarChar(150), email)
        .input('SenhaHash', sql.VarChar(255), senhaHash)
        .input('UserTipo', sql.VarChar(20), 'cliente')
        .input('ClinicaId', sql.Int, req.clinicaId)
        .input('ClienteId', sql.Int, clienteId)
        .query(`
          INSERT INTO Usuario
          (Nome, Email, SenhaHash, UserTipo, ClinicaId, ClienteId, Ativo, DataCadastro, PrecisaTrocarSenha)
          VALUES
          (@Nome, @Email, @SenhaHash, @UserTipo, @ClinicaId, @ClienteId, 1, GETDATE(), 1)
        `)
    );

    return res.status(201).json({ mensagem: 'Usuário cliente criado com sucesso' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: 'Erro ao criar usuário cliente' });
  }
}

/* =====================================================
   USUÁRIOS PROFISSIONAL
===================================================== */
async function criarUsuarioProfissional(req, res) {
  try {
    const { profissionalId, email, senha, nome } = req.body;

    if (!profissionalId || !email || !senha) {
      return res.status(400).json({
        mensagem: 'Profissional, email e senha são obrigatórios'
      });
    }

    const profissionalResult = await sql.connect().then(pool =>
      pool.request()
        .input('ProfissionalId', sql.Int, profissionalId)
        .input('ClinicaId', sql.Int, req.clinicaId)
        .query(`
          SELECT Id FROM Profissional
          WHERE Id = @ProfissionalId AND ClinicaId = @ClinicaId
        `)
    );

    if (profissionalResult.recordset.length === 0) {
      return res.status(404).json({ mensagem: 'Profissional não encontrado' });
    }

    const existente = await sql.connect().then(pool =>
      pool.request()
        .input('Email', sql.VarChar(150), email)
        .query(`SELECT Id FROM Usuario WHERE Email = @Email`)
    );

    if (existente.recordset.length > 0) {
      return res.status(409).json({ mensagem: 'Email já cadastrado' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    // ✅ CORREÇÃO: PrecisaTrocarSenha = 1
    await sql.connect().then(pool =>
      pool.request()
        .input('Nome', sql.VarChar(150), nome || '')
        .input('Email', sql.VarChar(150), email)
        .input('SenhaHash', sql.VarChar(255), senhaHash)
        .input('UserTipo', sql.VarChar(20), 'profissional')
        .input('ClinicaId', sql.Int, req.clinicaId)
        .input('ProfissionalId', sql.Int, profissionalId)
        .query(`
          INSERT INTO Usuario
          (Nome, Email, SenhaHash, UserTipo, ClinicaId, ProfissionalId, Ativo, DataCadastro, PrecisaTrocarSenha)
          VALUES
          (@Nome, @Email, @SenhaHash, @UserTipo, @ClinicaId, @ProfissionalId, 1, GETDATE(), 1)
        `)
    );

    return res.status(201).json({ mensagem: 'Usuário profissional criado com sucesso' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: 'Erro ao criar usuário profissional' });
  }
}

/* =====================================================
   USUÁRIOS ADMINISTRATIVOS (MASTER)
===================================================== */
async function listarUsuarios(req, res) {
  const result = await sql.connect().then(pool =>
    pool.request()
      .input('ClinicaId', sql.Int, req.clinicaId)
      .query(`
        SELECT Id, Nome, Email, Role, Ativo
        FROM Usuario
        WHERE ClinicaId = @ClinicaId AND UserTipo = 'clinica'
      `)
  );
  res.json(result.recordset);
}

async function criarUsuarioClinica(req, res) {
  const { nome, email, senha, role } = req.body;
  const senhaHash = await bcrypt.hash(senha, 10);

  await sql.connect().then(pool =>
    pool.request()
      .input('Nome', sql.VarChar(150), nome)
      .input('Email', sql.VarChar(150), email)
      .input('SenhaHash', sql.VarChar(255), senhaHash)
      .input('Role', sql.VarChar(20), role)
      .input('ClinicaId', sql.Int, req.clinicaId)
      .query(`
        INSERT INTO Usuario
        (Nome, Email, SenhaHash, UserTipo, Role, ClinicaId, Ativo, PrecisaTrocarSenha)
        VALUES
        (@Nome, @Email, @SenhaHash, 'clinica', @Role, @ClinicaId, 1, 1)
      `)
  );

  res.status(201).json({ mensagem: 'Usuário criado com sucesso' });
}

async function editarUsuario(req, res) {
  const { nome, email, role } = req.body;
  await sql.connect().then(pool =>
    pool.request()
      .input('Id', sql.Int, req.params.id)
      .input('Nome', sql.VarChar(150), nome)
      .input('Email', sql.VarChar(150), email)
      .input('Role', sql.VarChar(20), role)
      .query(`
        UPDATE Usuario
        SET Nome=@Nome, Email=@Email, Role=@Role
        WHERE Id=@Id
      `)
  );
  res.json({ mensagem: 'Usuário atualizado' });
}

async function alterarStatusUsuario(req, res) {
  await sql.connect().then(pool =>
    pool.request()
      .input('Id', sql.Int, req.params.id)
      .input('Ativo', sql.Bit, req.body.ativo ? 1 : 0)
      .query(`UPDATE Usuario SET Ativo=@Ativo WHERE Id=@Id`)
  );
  res.json({ mensagem: 'Status atualizado' });
}

async function redefinirSenha(req, res) {
  try {
    const id = Number(req.params.id)

    // ✅ permite:
    // - usuário alterar a própria senha
    // - MASTER alterar qualquer senha

    if (req.userId !== id && req.role !== 'MASTER') {
      return res.status(403).json({
        mensagem: 'Sem permissão para alterar esta senha'
      })
    }

    const senhaHash = await bcrypt.hash(req.body.novaSenha, 10);

    await sql.connect().then(pool =>
      pool.request()
        .input('Id', sql.Int, id)
        .input('SenhaHash', sql.VarChar(255), senhaHash)
        .query(`
          UPDATE Usuario
          SET SenhaHash=@SenhaHash, PrecisaTrocarSenha = 0
          WHERE Id=@Id
        `)
    );

    res.json({ mensagem: 'Senha redefinida com sucesso' });

  } catch (error) {
    console.error(error)
    return res.status(500).json({
      mensagem: 'Erro ao redefinir senha'
    })
  }
}


/* =====================================================
   EXCLUSÃO DE USUÁRIO ✅
===================================================== */
async function excluirUsuario(req, res) {
  try {
    const id = req.params.id

    if (Number(id) === req.userId) {
      return res.status(400).json({
        mensagem: 'Você não pode excluir seu próprio usuário'
      })
    }

    await sql.connect().then(pool =>
      pool.request()
        .input('Id', sql.Int, id)
        .query(`
          UPDATE Usuario
          SET Ativo = 0
          WHERE Id = @Id
        `)
    )

    return res.json({
      mensagem: 'Usuário excluído com sucesso'
    })

  } catch (error) {
    console.error(error)
    return res.status(500).json({
      mensagem: 'Erro ao excluir usuário'
    })
  }
}


module.exports = {
  criarUsuarioCliente,
  criarUsuarioProfissional,
  listarUsuarios,
  criarUsuarioClinica,
  editarUsuario,
  alterarStatusUsuario,
  redefinirSenha,
  excluirUsuario
};