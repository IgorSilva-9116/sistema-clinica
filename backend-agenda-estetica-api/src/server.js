require('dotenv').config();

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
    console.error('Erro ao iniciar servidor:', error);
  }
})();