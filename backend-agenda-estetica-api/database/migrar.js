/**
 * Executa um arquivo de migração .sql no banco configurado no .env
 * Uso: node database/migrar.js database/migrations/001_area_cliente.sql
 */
require('dotenv').config({ quiet: true });
const fs = require('fs');
const { sql, connectDatabase } = require('../src/config/database');

(async () => {
  const arquivo = process.argv[2];

  if (!arquivo) {
    console.error('Informe o arquivo .sql');
    process.exit(1);
  }

  // O driver não entende "GO": cada bloco é enviado separadamente
  const blocos = fs.readFileSync(arquivo, 'utf8')
    .split(/^\s*GO\s*$/im)
    .map(b => b.trim())
    .filter(Boolean);

  try {
    await connectDatabase();

    for (const bloco of blocos) {
      await sql.query(bloco);
    }

    console.log(`✅ Migração aplicada: ${arquivo} (${blocos.length} blocos)`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro na migração:', error.message);
    process.exit(1);
  }
})();
