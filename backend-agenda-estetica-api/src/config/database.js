const sql = require('mssql');

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER, // 127.0.0.1
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,

    enableArithAbort: true,

    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function connectDatabase() {
    try {
        await sql.connect(dbConfig);
        console.log('✅ Conectado ao SQL Server');
    } catch (error) {
        console.error('❌ Erro ao conectar no SQL Server:', error);
    }
}

module.exports = { sql, connectDatabase };

