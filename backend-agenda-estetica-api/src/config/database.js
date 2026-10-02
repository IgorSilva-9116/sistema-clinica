const sql = require('mssql');

// Azure SQL exige conexão criptografada; local (SQLEXPRESS) normalmente não
const encrypt = process.env.DB_ENCRYPT === 'true';

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER, // local: 127.0.0.1 | Azure: <servidor>.database.windows.net
    port: Number(process.env.DB_PORT) || 1433,
    database: process.env.DB_NAME,

    // Azure SQL serverless "acorda" do auto-pause em até ~1 min
    connectionTimeout: 60000,
    requestTimeout: 30000,

    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },

    options: {
        encrypt,
        // Só confia em certificado não validado quando não está criptografando (dev local)
        trustServerCertificate: !encrypt,
        enableArithAbort: true
    }
};

async function connectDatabase() {
    await sql.connect(dbConfig);
    console.log(`✅ Conectado ao SQL Server (${dbConfig.server}/${dbConfig.database})`);
}

module.exports = { sql, connectDatabase };
