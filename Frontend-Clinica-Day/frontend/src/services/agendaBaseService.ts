import { api } from './api'

export interface AgendaBaseItem {
  id: number
  diaSemana: number
  horaInicio: string
  horaFim: string
  ativo: boolean
}

export const agendaBaseService = {

  async listar() {
    const response = await api.get('/agenda/base')
    return response.data
  },

  async atualizarHorario(id: number, horaInicio: string, horaFim: string) {
    const response = await api.put(`/agenda/base/${id}`, {
      horaInicio,
      horaFim
    })
    return response.data
  },

  async ativar(id: number) {
    const response = await api.patch(`/agenda/base/${id}/ativar`)
    return response.data
  },

  async desativar(id: number) {
    const response = await api.patch(`/agenda/base/${id}/desativar`)
    return response.data
  }
}
