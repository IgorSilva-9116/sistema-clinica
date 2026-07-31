import { api } from './api'
import type { NovoAgendamento } from '../types/NovoAgendamento'

// Service responsável por Agendamentos
export const agendamentoService = {

  // ==============================
  // Lista agendamentos (ex: agenda do dia)
  // ==============================
  async listar(data: string) {
    const response = await api.get('/agendamentos', {
      params: { data }
    })

    return response.data
  },

  // ==============================
  // CRIAR AGENDAMENTO (CLIENTE - APP)
  // ==============================
  async criar(dados: NovoAgendamento) {
    const response = await api.post('/agendamentos', dados)
    return response.data
  },

  // ==============================
  // CRIAR AGENDAMENTO (CLÍNICA - WEB)
  // ==============================
  async criarClinica(payload: {
    clienteId: number
    profissionalId: number
    servicoId: number
    dataAgendamento: string
    horaInicio: string
  }) {
    const response = await api.post('/agendamentos', payload)
    return response.data
  }
}



