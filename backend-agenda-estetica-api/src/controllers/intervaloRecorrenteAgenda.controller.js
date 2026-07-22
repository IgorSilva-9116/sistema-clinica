const { sql } = require('../config/database');

/**
 * =========================
 * LISTAR INTERVALOS
 * =========================
 */
async function listarIntervalos(req, res) {
    try {

        if (req.userTipo !== 'clinica') {
            return res.status(403).json({
                sucesso: false,
                mensagem: 'Acesso negado'
            });
        }

        const clinicaId = req.clinicaId;

        const result = await sql.connect().then(pool =>
            pool.request()
                .input('ClinicaId', sql.Int, clinicaId)
                .query(`
         SELECT
          Id,
          DiaSemana,

          CONVERT(VARCHAR(5), HoraInicio, 108) AS HoraInicio,
          CONVERT(VARCHAR(5), HoraFim, 108) AS HoraFim,

          Descricao,
          DataInicio,
          DataFim,
          Ativo
          FROM IntervaloRecorrenteAgenda
          WHERE ClinicaId = @ClinicaId
          ORDER BY DiaSemana, HoraInicio
        `)
        );

        return res.json({
            sucesso: true,
            intervalos: result.recordset
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao listar intervalos'
        });

    }
}

/**
 * =========================
 * CRIAR INTERVALO
 * =========================
 */
async function criarIntervalo(req, res) {
    try {

        if (req.userTipo !== 'clinica') {
            return res.status(403).json({
                sucesso: false,
                mensagem: 'Acesso negado'
            });
        }

        const clinicaId = req.clinicaId;

        const {
            diaSemana,
            horaInicio,
            horaFim,
            descricao,
            dataInicio,
            dataFim
        } = req.body;

        if (
            diaSemana === undefined ||
            !horaInicio ||
            !horaFim ||
            !descricao
        ) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Campos obrigatórios não preenchidos'
            });
        }

        if (horaInicio >= horaFim) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'A hora final deve ser maior que a hora inicial'
            });
        }

        // =========================
        // VALIDAR CONFLITO
        // =========================

        const conflito = await sql.connect().then(pool =>
            pool.request()
                .input('ClinicaId', sql.Int, clinicaId)
                .input('DiaSemana', sql.Int, diaSemana)
                .input('HoraInicio', sql.VarChar(8), `${horaInicio}:00`)
                .input('HoraFim', sql.VarChar(8), `${horaFim}:00`)
                .query(`
          SELECT TOP 1 Id
          FROM IntervaloRecorrenteAgenda
          WHERE ClinicaId = @ClinicaId
            AND DiaSemana = @DiaSemana
            AND Ativo = 1
            AND (
              CAST(@HoraInicio AS TIME) < HoraFim
              AND
              CAST(@HoraFim AS TIME) > HoraInicio
            )
        `)
        );

        if (conflito.recordset.length > 0) {
            return res.status(409).json({
                sucesso: false,
                mensagem:
                    'Já existe um intervalo recorrente que conflita com este horário.'
            });
        }

        await sql.connect().then(pool =>
            pool.request()
                .input('ClinicaId', sql.Int, clinicaId)
                .input('DiaSemana', sql.Int, diaSemana)
                .input('HoraInicio', sql.VarChar(8), `${horaInicio}:00`)
                .input('HoraFim', sql.VarChar(8), `${horaFim}:00`)
                .input('Descricao', sql.VarChar(100), descricao)
                .input('DataInicio', sql.Date, dataInicio || null)
                .input('DataFim', sql.Date, dataFim || null)
                .query(`
          INSERT INTO IntervaloRecorrenteAgenda
          (
            ClinicaId,
            DiaSemana,
            HoraInicio,
            HoraFim,
            Descricao,
            DataInicio,
            DataFim
          )
          VALUES
          (
            @ClinicaId,
            @DiaSemana,
            CAST(@HoraInicio AS TIME),
            CAST(@HoraFim AS TIME),
            @Descricao,
            @DataInicio,
            @DataFim
          )
        `)
        );

        return res.status(201).json({
            sucesso: true,
            mensagem: 'Intervalo recorrente criado com sucesso'
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao criar intervalo recorrente'
        });

    }
}

async function atualizarIntervalo(req, res) {
    try {

        if (req.userTipo !== 'clinica') {
            return res.status(403).json({
                sucesso: false,
                mensagem: 'Acesso negado'
            });
        }

        const { id } = req.params;

        const {
            diaSemana,
            horaInicio,
            horaFim,
            descricao,
            dataInicio,
            dataFim
        } = req.body;

        if (horaInicio >= horaFim) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    'A hora final deve ser maior que a hora inicial'
            });
        }

        const clinicaId = req.clinicaId;

        const conflito = await sql.connect().then(pool =>
            pool.request()
                .input('Id', sql.Int, Number(id))
                .input('ClinicaId', sql.Int, clinicaId)
                .input('DiaSemana', sql.Int, diaSemana)
                .input('HoraInicio', sql.VarChar(8), `${horaInicio}:00`)
                .input('HoraFim', sql.VarChar(8), `${horaFim}:00`)
                .query(`
          SELECT TOP 1 Id
          FROM IntervaloRecorrenteAgenda
          WHERE ClinicaId = @ClinicaId
            AND DiaSemana = @DiaSemana
            AND Ativo = 1
            AND Id <> @Id
            AND (
              CAST(@HoraInicio AS TIME) < HoraFim
              AND
              CAST(@HoraFim AS TIME) > HoraInicio
            )
        `)
        );

        if (conflito.recordset.length > 0) {
            return res.status(409).json({
                sucesso: false,
                mensagem:
                    'Já existe um intervalo recorrente que conflita com este horário.'
            });
        }

        await sql.connect().then(pool =>
            pool.request()
                .input('Id', sql.Int, Number(id))
                .input('DiaSemana', sql.Int, diaSemana)
                .input('HoraInicio', sql.VarChar(8), `${horaInicio}:00`)
                .input('HoraFim', sql.VarChar(8), `${horaFim}:00`)
                .input('Descricao', sql.VarChar(100), descricao)
                .input('DataInicio', sql.Date, dataInicio || null)
                .input('DataFim', sql.Date, dataFim || null)
                .query(`
          UPDATE IntervaloRecorrenteAgenda
          SET
            DiaSemana = @DiaSemana,
            HoraInicio = CAST(@HoraInicio AS TIME),
            HoraFim = CAST(@HoraFim AS TIME),
            Descricao = @Descricao,
            DataInicio = @DataInicio,
            DataFim = @DataFim
          WHERE Id = @Id
        `)
        );

        return res.json({
            sucesso: true,
            mensagem: 'Intervalo atualizado com sucesso'
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao atualizar intervalo'
        });

    }
}

async function desativarIntervalo(req, res) {
    try {

        const { id } = req.params;

        await sql.connect().then(pool =>
            pool.request()
                .input('Id', sql.Int, Number(id))
                .query(`
          UPDATE IntervaloRecorrenteAgenda
          SET Ativo = 0
          WHERE Id = @Id
        `)
        );

        return res.json({
            sucesso: true,
            mensagem: 'Intervalo desativado'
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao desativar intervalo'
        });

    }
}

async function ativarIntervalo(req, res) {
    try {

        const { id } = req.params;

        await sql.connect().then(pool =>
            pool.request()
                .input('Id', sql.Int, Number(id))
                .query(`
          UPDATE IntervaloRecorrenteAgenda
          SET Ativo = 1
          WHERE Id = @Id
        `)
        );

        return res.json({
            sucesso: true,
            mensagem: 'Intervalo ativado'
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao ativar intervalo'
        });

    }
}

async function excluirIntervalo(req, res) {
    try {

        const { id } = req.params;

        await sql.connect().then(pool =>
            pool.request()
                .input('Id', sql.Int, Number(id))
                .query(`
          DELETE
          FROM IntervaloRecorrenteAgenda
          WHERE Id = @Id
        `)
        );

        return res.json({
            sucesso: true,
            mensagem: 'Intervalo excluído'
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao excluir intervalo'
        });

    }
}

module.exports = {
    listarIntervalos,
    criarIntervalo,
    atualizarIntervalo,
    ativarIntervalo,
    desativarIntervalo,
    excluirIntervalo
};