/* =========================================================
   003 - VÁRIOS SERVIÇOS NO MESMO ATENDIMENTO
   Cada serviço continua sendo um Agendamento (relatórios por
   serviço seguem iguais); os que foram marcados juntos, em
   sequência, compartilham o mesmo GrupoAgendamento.
   Pode ser executado mais de uma vez sem efeito colateral.
   ========================================================= */

IF COL_LENGTH('dbo.Agendamento', 'GrupoAgendamento') IS NULL
    ALTER TABLE dbo.Agendamento ADD GrupoAgendamento UNIQUEIDENTIFIER NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Agendamento_Grupo')
    CREATE INDEX IX_Agendamento_Grupo ON dbo.Agendamento(GrupoAgendamento)
    WHERE GrupoAgendamento IS NOT NULL;
GO
