require('./config/env');

const app = require('./app');
const { connectDatabase } = require('./config/database');

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`🚀 API rodando na porta ${PORT}`);
    });

  } catch (error) {
    // Sem banco a API não serve pra nada: encerra para o host (Render/Azure) reiniciar
    console.error('❌ Erro ao iniciar servidor:', error.message);
    process.exit(1);
  }
})();
