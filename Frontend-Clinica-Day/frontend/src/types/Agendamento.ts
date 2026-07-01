import type { Cliente } from './Cliente'
import type { Servico } from './Servico'
import type { Profissional } from './Profissional'

// Representa dbo.Agendamento (modelo real do backend)
export type Agendamento = {
  id: number                    // PK
  clinicaId: number             // FK para Clínica
  clienteId: number             // FK para Cliente
  profissionalId: number        // FK para Profissional
  servicoId: number             // FK para Serviço

  dataAgendamento: string       // YYYY-MM-DD
  horaInicio: string            // HH:mm
  horaFim: string               // HH:mm

  status:
    | 'Agendado'
    | 'Confirmado'
    | 'EmAtendimento'
    | 'Finalizado'
    | 'Cancelado'

  // Objetos completos (quando API retornar JOIN)
  cliente?: Cliente
  profissional?: Profissional
  servico?: Servico
}


