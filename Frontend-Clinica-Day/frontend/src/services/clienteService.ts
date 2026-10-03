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
  },

  // Link de acesso ao app da cliente (enviado pelo WhatsApp)
  async gerarConvite(id: number): Promise<{ link: string; telefone?: string | null; mensagem: string }> {
    const response = await api.post(`/clientes/${id}/convite`)
    return response.data
  },

  // Endereço público da clínica: /c/<slug>
  async obterLinkPublico(): Promise<string | null> {
    const response = await api.get('/clinica/link-publico')
    return response.data.slug
  }

}