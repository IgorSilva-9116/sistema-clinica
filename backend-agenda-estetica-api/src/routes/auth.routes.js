const express = require('express');
const router = express.Router();

const { loginUnico } = require('../controllers/auth.controller');

router.post('/login', loginUnico);

const authMiddleware = require('../middlewares/auth.middleware');

// Rota protegida de teste
router.get('/perfil', authMiddleware, (req, res) => {
    return res.status(200).json({
        sucesso: true,
        mensagem: 'Acesso autorizado',
        usuario: {
            id: req.userId,
            tipo: req.userTipo
        }
    });
});


module.exports = router;



