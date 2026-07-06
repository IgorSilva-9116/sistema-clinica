export type Despesa = {
  Id: number
  Descricao: string
  Valor: number
  Data: string

  Categoria?: string

  CategoriaFinanceiraId?: number | null
  CategoriaFinanceira?: string

  FormaPagamento?: string
  Observacao?: string

  Status: string
}