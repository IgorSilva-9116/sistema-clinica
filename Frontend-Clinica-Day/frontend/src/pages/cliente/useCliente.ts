import { useOutletContext } from 'react-router-dom'
import type { PerfilCliente } from '../../services/clientePortalService'

export interface ClienteContexto {
  perfil: PerfilCliente
  recarregarPerfil: () => Promise<void>
}

// Dados da cliente logada, fornecidos pelo ClienteLayout
export function useCliente() {
  return useOutletContext<ClienteContexto>()
}
