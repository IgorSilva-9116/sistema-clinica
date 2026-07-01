export interface Servico {
  id: number
  titulo: string
  descricao?: string
  preco: number
  duracaoMinutos: number
  status: 'Ativo' | 'Inativo'
}