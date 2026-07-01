import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { servicoService } from '../services/servicoService'

export function EditarServico() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [preco, setPreco] = useState<number>(0)
  const [duracaoMinutos, setDuracaoMinutos] = useState<number>(0)

  useEffect(() => {
    async function carregarServico() {
      try {
        if (!id) return

        const servico = await servicoService.buscarPorId(Number(id))

        if (!servico) {
          setErro('Serviço não encontrado')
          return
        }

        setTitulo(servico.titulo)
        setDescricao(servico.descricao || '')
        setPreco(servico.preco)
        setDuracaoMinutos(servico.duracaoMinutos)

      } catch {
        setErro('Erro ao carregar serviço')
      } finally {
        setLoading(false)
      }
    }

    carregarServico()
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)

    try {
      if (!id) return

      await servicoService.atualizar(Number(id), {
        titulo,
        descricao,
        preco,
        duracaoMinutos
      })

      navigate('/servicos')
    } catch {
      setErro('Erro ao atualizar serviço')
    }
  }

  if (loading) return <p>Carregando serviço...</p>
  if (erro) return <p>{erro}</p>

  return (
    <div>
      <h2>Editar Serviço</h2>

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

        <button type="submit">Salvar Alterações</button>
      </form>
    </div>
  )
}