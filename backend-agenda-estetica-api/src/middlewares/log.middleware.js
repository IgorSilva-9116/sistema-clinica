module.exports = function logMiddleware(req, res, next) {
    const inicio = Date.now();

    res.on('finish', () => {
        const duracao = Date.now() - inicio;

        const log = {
            timestamp: new Date().toISOString(),
            method: req.method,
            path: req.originalUrl,
            status: res.statusCode,
            durationMs: duracao,
            userType: req.userTipo || 'anonimo',
            userId: req.userId || null
        };

        console.log(JSON.stringify(log));
    });

    next();
};