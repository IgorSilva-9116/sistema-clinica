import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { servicoService } from '../services/servicoService'

export function NovoServico() {
  const navigate = useNavigate()

  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [preco, setPreco] = useState<number>(0)
  const [duracaoMinutos, setDuracaoMinutos] = useState<number>(0)
  const [erro, setErro] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)

    try {
      await servicoService.criar({
        titulo,
        descricao,
        preco,
        duracaoMinutos
      })

      navigate('/servicos')
    } catch {
      setErro('Erro ao criar serviço')
    }
  }

  return (
    <div>
      <h2>Novo Serviço</h2>

      {erro && <p>{erro}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>Título</label>
          <input
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Descrição</label>
          <input
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
          />
        </div>

        <div>
          <label>Preço</label>
          <input
            type="number"
            step="0.01"
            value={preco}
            onChange={e => setPreco(Number(e.target.value))}
            required
          />
        </div>

        <div>
          <label>Duração (min)</label>
          <input
            type="number"
            value={duracaoMinutos}
            onChange={e => setDuracaoMinutos(Number(e.target.value))}
            required
          />
        </div>

        <button type="submit">Salvar</button>
      </form>
    </div>
  )
}