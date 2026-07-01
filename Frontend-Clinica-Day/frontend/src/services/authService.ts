import { api } from './api'

export async function login(email: string, senha: string): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/login', {
    email,
    senha
  })

  return response.data
}
interface LoginResponse {
  sucesso: boolean
  token: string
  usuario: {
    id: number
    email: string
    userTipo: 'clinica' | 'cliente' | 'profissional'
    clinicaId: number
    clienteId?: number | null
    profissionalId?: number | null
  }
}

