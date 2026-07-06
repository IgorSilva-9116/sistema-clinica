
import { api } from './api'

export interface CategoriaFinanceira {
  id: number
  nome: string
  status: string
}

interface ListarCategoriasResponse {
  sucesso: boolean
  categorias: CategoriaFinanceira[]
}

export const categoriaFinanceiraService = {

  async listar(): Promise<ListarCategoriasResponse> {
    const response =
      await api.get('/categorias-financeiras')

    return response.data
  },

  async criar(nome: string) {
    const response =
      await api.post(
        '/categorias-financeiras',
        { nome }
      )

    return response.data
  },

  async ativar(id: number) {
    const response =
      await api.patch(
        `/categorias-financeiras/${id}/ativar`
      )

    return response.data
  },

  async desativar(id: number) {
    const response =
      await api.patch(
        `/categorias-financeiras/${id}/desativar`
      )

    return response.data
  }

}