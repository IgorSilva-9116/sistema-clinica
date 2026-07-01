import { api } from './api'
import type { Servico } from '../types/Servico'

interface ListarServicosResponse {
  sucesso: boolean
  servicos: Servico[]
}

export interface ServicoPayload {
  titulo: string
  descricao?: string
  preco: number
  duracaoMinutos: number
}

export const servicoService = {

  // ✅ Serviços ATIVOS (uso geral: agendamento, cliente, profissional)
  async listar(): Promise<ListarServicosResponse> {
    const response = await api.get<ListarServicosResponse>('/servicos')
    return response.data
  },

  // ✅ Serviços ADMIN (ativos + inativos)
  async listarAdmin(): Promise<ListarServicosResponse> {
    const response = await api.get<ListarServicosResponse>('/servicos/admin')
    return response.data
  },

  // ✅ Criar serviço
  async criar(payload: ServicoPayload) {
    const response = await api.post('/servicos', payload)
    return response.data
  },

  // ✅ Atualizar serviço
  async atualizar(id: number, payload: ServicoPayload) {
    const response = await api.put(`/servicos/${id}`, payload)
    return response.data
  },

  // ✅ Desativar serviço
  async desativar(id: number) {
    const response = await api.patch(`/servicos/${id}/desativar`)
    return response.data
  },

  // ✅ Ativar serviço
  async ativar(id: number) {
    const response = await api.patch(`/servicos/${id}/ativar`)
    return response.data
  },
  
  //Ajustar o Serviço
  async buscarPorId(id: number) {
   const response = await api.get('/servicos/admin')
   const servicos = response.data.servicos || []
   return servicos.find((s: any) => s.id === id)
  }
}


