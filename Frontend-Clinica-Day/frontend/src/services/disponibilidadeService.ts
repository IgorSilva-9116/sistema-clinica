import { api } from './api'

export const disponibilidadeService = {
  async listarHorarios(params: {
    profissionalId: number
    servicoId: number
    dataAgendamento: string
  }): Promise<string[]> {

    const { profissionalId, servicoId, dataAgendamento } = params

    const response = await api.get(
      '/agenda/horarios-disponiveis-profissional',
      {
        params: {
          profissionalId,
          servicoId,
          data: dataAgendamento,
        },
      }
    )

    return response.data
  },
}
