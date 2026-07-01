import { api } from './api'
import type { Profissional } from '../types/Profissional'

interface ListarProfissionaisResponse {
  sucesso: boolean
  profissionais: Profissional[]
}

export const profissionalService = {
  async listar(): Promise<ListarProfissionaisResponse> {
    const response = await api.get<ListarProfissionaisResponse>('/profissionais')
    return response.data
  }
}
