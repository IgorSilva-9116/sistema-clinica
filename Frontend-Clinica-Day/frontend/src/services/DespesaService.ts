import { api } from './api'
import type { Despesa } from '../types/Despesa'



export async function listarDespesas(
  dataInicio?: string,
  dataFim?: string
): Promise<Despesa[]> {
  const resp = await api.get('/despesas', {
    params: { dataInicio, dataFim }
  })

  console.log('DEBUG DESPESAS:', resp.data)

  return resp.data.despesas || []
}


export async function criarDespesa(data: Partial<Despesa>) {
  await api.post('/despesas', data)
}

export async function editarDespesa(
  id: number,
  data: Partial<Despesa>
) {

  await api.put(
    `/despesas/${id}`,
    data
  )

}

export async function excluirDespesa(id: number) {
  await api.delete(`/despesas/${id}`)
}

export async function obterDespesaPorId(
  id: number
) {
  const response =
    await api.get(`/despesas/${id}`)

  return response.data
}