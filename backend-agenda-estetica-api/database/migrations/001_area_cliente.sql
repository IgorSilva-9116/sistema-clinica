/* =========================================================
   001 - ÁREA DO CLIENTE (Etapa 1)
   Pode ser executado mais de uma vez sem efeito colateral.
   ========================================================= */

-- Endereço público da clínica: /c/<slug>
IF COL_LENGTH('dbo.Clinica', 'Slug') IS NULL
    ALTER TABLE dbo.Clinica ADD Slug VARCHAR(80) NULL;
GO

-- Nome real da clínica (o cadastro inicial era um nome de teste)
UPDATE dbo.Clinica
SET Nome = N'Clínica Dayênia Neves Estética'
WHERE Id = 1 AND Nome = N'Clínica Bella Vida';

UPDATE dbo.Clinica
SET Slug = 'dayenia-neves'
WHERE Id = 1 AND (Slug IS NULL OR Slug = 'bella-vida');
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_Clinica_Slug')
    CREATE UNIQUE INDEX UX_Clinica_Slug ON dbo.Clinica(Slug) WHERE Slug IS NOT NULL;
GO

-- Quem criou o agendamento: a clínica ou a própria cliente pelo app
IF COL_LENGTH('dbo.Agendamento', 'Origem') IS NULL
    ALTER TABLE dbo.Agendamento
        ADD Origem VARCHAR(20) NOT NULL
        CONSTRAINT DF_Agendamento_Origem DEFAULT 'CLINICA';
GO

-- Padroniza status antigos ('Cancelado' -> 'CANCELADO')
UPDATE dbo.Agendamento
SET Status = UPPER(Status)
WHERE Status COLLATE Latin1_General_CS_AS <> UPPER(Status);
GO
