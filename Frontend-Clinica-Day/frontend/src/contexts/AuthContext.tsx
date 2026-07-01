import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { login as loginService } from '../services/authService'

type UserTipo = 'clinica' | 'cliente' | 'profissional'

interface Usuario {
  id: number
  email: string
  userTipo: UserTipo
  role?: string | null
  clinicaId: number
  clienteId?: number | null
  profissionalId?: number | null
  precisaTrocarSenha?: boolean
}

interface AuthContextData {
  usuario: Usuario | null
  loading: boolean
  login: (email: string, senha: string) => Promise<void>
  logout: () => void
  setUsuario: (usuario: Usuario | null) => void // ✅ NOVO
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const usuarioStorage = sessionStorage.getItem('usuario')
    return usuarioStorage ? JSON.parse(usuarioStorage) : null
  })

  const [loading, setLoading] = useState(false)

  async function login(email: string, senha: string) {
    setLoading(true)
    try {
      const response = await loginService(email, senha)

      sessionStorage.setItem('token', response.token)
      sessionStorage.setItem('usuario', JSON.stringify(response.usuario))

      setUsuario(response.usuario)
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('usuario')
    setUsuario(null)
  }

  return (
    <AuthContext.Provider
      value={{ usuario, loading, login, logout, setUsuario }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
