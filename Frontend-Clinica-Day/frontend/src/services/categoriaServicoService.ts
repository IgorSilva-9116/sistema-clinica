import { api } from './api'

export interface CategoriaServico {
  id: number
  nome: string
  status: string
}

interface ListarCategoriasResponse {
  sucesso: boolean
  categorias: CategoriaServico[]
}

export const categoriaServicoService = {

  async listar(): Promise<ListarCategoriasResponse> {
    const response = await api.get(
      '/categorias-servico'
    )

    return response.data
  },

  async criar(nome: string) {

    const response = await api.post(
      '/categorias-servico',
      { nome }
    )

    return response.data
  },

  async ativar(id: number) {

    const response = await api.patch(
      `/categorias-servico/${id}/ativar`
    )

    return response.data
  },

  async desativar(id: number) {

    const response = await api.patch(
      `/categorias-servico/${id}/desativar`
    )

    return response.data
  }

}