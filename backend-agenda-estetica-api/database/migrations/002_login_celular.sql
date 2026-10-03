/* =========================================================
   002 - LOGIN PELO CELULAR (clientes sem e-mail)
   E-mail passa a ser opcional (mas continua único quando existe)
   e o usuário-cliente ganha o celular como forma de login.
   Pode ser executado mais de uma vez sem efeito colateral.
   ========================================================= */

-- ---------- Cliente.Email opcional ----------

-- O nome da regra UNIQUE foi gerado automaticamente pelo SQL Server
-- e muda de um banco para outro: busca pelo nome da coluna
DECLARE @regra SYSNAME = (
    SELECT kc.name
    FROM sys.key_constraints kc
    JOIN sys.index_columns ic ON ic.object_id = kc.parent_object_id AND ic.index_id = kc.unique_index_id
    JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
    WHERE kc.parent_object_id = OBJECT_ID('dbo.Cliente')
      AND kc.type = 'UQ'
      AND c.name = 'Email'
);

IF @regra IS NOT NULL
    EXEC('ALTER TABLE dbo.Cliente DROP CONSTRAINT ' + @regra);
GO

IF COLUMNPROPERTY(OBJECT_ID('dbo.Cliente'), 'Email', 'AllowsNull') = 0
    ALTER TABLE dbo.Cliente ALTER COLUMN Email VARCHAR(150) NULL;
GO

UPDATE dbo.Cliente SET Email = NULL WHERE LTRIM(RTRIM(Email)) = '';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_Cliente_Email')
    CREATE UNIQUE INDEX UX_Cliente_Email ON dbo.Cliente(Email) WHERE Email IS NOT NULL;
GO

-- ---------- Usuario.Email opcional + Usuario.Telefone ----------

IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = 'UQ_Usuario_Email')
    ALTER TABLE dbo.Usuario DROP CONSTRAINT UQ_Usuario_Email;
GO

IF COLUMNPROPERTY(OBJECT_ID('dbo.Usuario'), 'Email', 'AllowsNull') = 0
    ALTER TABLE dbo.Usuario ALTER COLUMN Email VARCHAR(150) NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_Usuario_Email')
    CREATE UNIQUE INDEX UX_Usuario_Email ON dbo.Usuario(Email) WHERE Email IS NOT NULL;
GO

-- Celular só com dígitos e DDD, sem o 55 (ex.: 32988887777)
IF COL_LENGTH('dbo.Usuario', 'Telefone') IS NULL
    ALTER TABLE dbo.Usuario ADD Telefone VARCHAR(20) NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_Usuario_Telefone')
    CREATE UNIQUE INDEX UX_Usuario_Telefone ON dbo.Usuario(Telefone) WHERE Telefone IS NOT NULL;
GO
