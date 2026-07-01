export type Cliente = {
  id: number
  nome: string
  telefone: string
  email?: string
  ativo: string

  // ✅ NOVOS CAMPOS
  sexo?: string
  dataNascimento?: string
  foto?: string
}