import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { ReactNode } from 'react'

interface PrivateRouteProps {
  children: ReactNode
  allow?: Array<'clinica' | 'profissional' | 'cliente'>
}

export function PrivateRoute({ children, allow }: PrivateRouteProps) {
  const { usuario, loading } = useAuth()
  const location = useLocation()

  if (loading) return <p>Carregando...</p>

  if (!usuario) {
    // Área da cliente: volta para a tela de entrar da clínica dela
    const slug = localStorage.getItem('clinicaSlug')
    if (allow?.includes('cliente') && slug) {
      return <Navigate to={`/c/${slug}/entrar`} replace />
    }
    return <Navigate to="/login" replace />
  }

  // ✅ regra obrigatória
  if (
    usuario.precisaTrocarSenha &&
    location.pathname !== '/alterar-senha'
  ) {
    return <Navigate to="/alterar-senha" replace />
  }

  if (allow && !allow.includes(usuario.userTipo)) {
    // Cliente que cai numa tela da clínica volta para a área dela
    if (usuario.userTipo === 'cliente') {
      return <Navigate to="/cliente" replace />
    }
    return <Navigate to="/acesso-negado" replace />
  }

  return <>{children}</>
}
