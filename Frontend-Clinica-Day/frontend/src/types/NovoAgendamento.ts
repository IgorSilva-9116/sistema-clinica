// Payload para criação de agendamento (Etapa 7)
export type NovoAgendamento = {
  clinicaId: number
  clienteId: number
  profissionalId: number
  servicoId: number
  dataAgendamento: string   // YYYY-MM-DD
  horaInicio: string        // HH:mm
}