const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    // Verifica se o header Authorization existe
    if (!authHeader) {
        return res.status(401).json({
            sucesso: false,
            mensagem: 'Token não informado'
        });
    }

    // Formato esperado: Bearer TOKEN
    const parts = authHeader.split(' ');

    if (parts.length !== 2) {
        return res.status(401).json({
            sucesso: false,
            mensagem: 'Token mal formatado'
        });
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
        return res.status(401).json({
            sucesso: false,
            mensagem: 'Token mal formatado'
        });
    }

    // Verifica e decodifica o token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'Token inválido ou expirado'
            });
        }

        // ✅ Dados do token disponíveis na requisição
     req.userId = decoded.userId || decoded.id;
     req.userTipo = decoded.userTipo || decoded.tipo;
     req.role = decoded.role || null;
     req.clinicaId = decoded.clinicaId || null;
     req.profissionalId = decoded.profissionalId || null;
     req.clienteId = decoded.clienteId || null;
        return next();
    });
}

module.exports = authMiddleware;
