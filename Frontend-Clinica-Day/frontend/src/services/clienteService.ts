import { api } from './api'
import type { Cliente } from '../types/Cliente'

type listarClientesResponse = {
  clientes: Cliente[]
}

export const clienteService = {
  async listar(): Promise<listarClientesResponse> {
    const response = await api.get('/clientes')
    return response.data
  },

  // ✅ CORRIGIDO AQUI
  async criar(cliente: any): Promise<void> {
    await api.post('/clientes', cliente, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  async buscarPorId(id: number) {
    const response = await api.get(`/clientes/${id}`)
    return response.data
  },

  async atualizar(id: number, cliente: any): Promise<void> {
    await api.put(`/clientes/${id}`, cliente, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  async listarAniversariantes() {
    const response = await api.get('/clientes/aniversariantes')
    return response.data
  }

}