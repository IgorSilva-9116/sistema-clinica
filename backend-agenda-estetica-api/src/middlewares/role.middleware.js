function authorize(...rolesPermitidos) {
  return (req, res, next) => {

    // Não autenticado
    if (!req.userTipo) {
      return res.status(401).json({
        mensagem: 'Usuário não autenticado'
      });
    }

    /**
     * ✅ COMPATIBILIDADE COM ROTAS ANTIGAS
     * Ex: authorize('clinica')
     */
    if (rolesPermitidos.includes(req.userTipo)) {
      return next();
    }

    /**
     * ✅ NOVO MODELO: ROLE
     * Somente usuários do tipo clinica possuem role
     */
    if (req.userTipo !== 'clinica') {
      return res.status(403).json({
        mensagem: 'Acesso restrito a usuários da clínica'
      });
    }

    if (!req.role || !rolesPermitidos.includes(req.role)) {
      return res.status(403).json({
        mensagem: 'Você não tem permissão para acessar este recurso'
      });
    }

    return next();
  };
}

module.exports = authorize;
