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
    return <Navigate to="/acesso-negado" replace />
  }

  return <>{children}</>
}
