// Representa dbo.HorarioFuncionamento
export type HorarioFuncionamento = {
  id: number                 // PK
  clinicaId: number          // FK para Clinica
  diaSemana: number          // 0 = Domingo, 6 = Sábado
  horaInicio: string         // HH:mm
  horaFim: string            // HH:mm
}