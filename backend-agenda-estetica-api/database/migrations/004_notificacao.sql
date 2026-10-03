/* =========================================================
   004 - NOTIFICAÇÕES DA CLIENTE
   Cada aviso (confirmação, cancelamento...) fica registrado aqui
   e aparece no app. As colunas de e-mail e WhatsApp marcam o envio
   por esses canais (Fase 4) sem precisar mudar a tabela depois.
   Pode ser executado mais de uma vez sem efeito colateral.
   ========================================================= */

IF OBJECT_ID('dbo.Notificacao') IS NULL
BEGIN
    CREATE TABLE dbo.Notificacao (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Notificacao PRIMARY KEY,
        ClinicaId INT NOT NULL CONSTRAINT FK_Notificacao_Clinica REFERENCES dbo.Clinica(Id),
        ClienteId INT NOT NULL CONSTRAINT FK_Notificacao_Cliente REFERENCES dbo.Cliente(Id),
        AgendamentoId INT NULL,
        Tipo VARCHAR(40) NOT NULL,
        Titulo NVARCHAR(150) NOT NULL,
        Mensagem NVARCHAR(1000) NOT NULL,
        Lida BIT NOT NULL CONSTRAINT DF_Notificacao_Lida DEFAULT 0,
        CriadaEm DATETIME NOT NULL CONSTRAINT DF_Notificacao_CriadaEm DEFAULT GETDATE(),
        EmailEnviadoEm DATETIME NULL,
        WhatsAppEnviadoEm DATETIME NULL
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Notificacao_Cliente')
    CREATE INDEX IX_Notificacao_Cliente ON dbo.Notificacao(ClienteId, Lida, CriadaEm DESC);
GO
