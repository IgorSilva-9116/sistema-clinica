import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { servicoService } from '../services/servicoService'
import {
  categoriaServicoService,
  type CategoriaServico
} from '../services/categoriaServicoService'

export function NovoServico() {

  const navigate = useNavigate()

  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [preco, setPreco] = useState<number>(0)
  const [duracaoMinutos, setDuracaoMinutos] =
    useState<number>(0)

  const [categoriaServicoId, setCategoriaServicoId] =
    useState('')

  const [categorias, setCategorias] =
    useState<CategoriaServico[]>([])

  const [erro, setErro] =
    useState<string | null>(null)

  useEffect(() => {
    carregarCategorias()
  }, [])

  async function carregarCategorias() {

    const response =
      await categoriaServicoService.listar()

    const categoriasAtivas =
      (response.categorias || []).filter(
        c => c.status === 'Ativo'
      )

    setCategorias(categoriasAtivas)
  }

  async function handleSubmit(
    e: React.FormEvent
  ) {

    e.preventDefault()

    setErro(null)

    try {

      await servicoService.criar({
        titulo,
        descricao,
        preco,
        duracaoMinutos,
        categoriaServicoId:
          categoriaServicoId
            ? Number(categoriaServicoId)
            : null
      })

      navigate('/servicos')

    } catch {

      setErro(
        'Erro ao criar serviço'
      )

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
            onChange={e =>
              setTitulo(
                e.target.value
              )
            }
            required
          />
        </div>

        <div>
          <label>Categoria</label>

          <select
            value={categoriaServicoId}
            onChange={e =>
              setCategoriaServicoId(
                e.target.value
              )
            }
            required
          >
            <option value="">
              Selecione
            </option>

            {categorias.map(c => (

              <option
                key={c.id}
                value={c.id}
              >
                {c.nome}
              </option>

            ))}
          </select>
        </div>

        <div>
          <label>Descrição</label>

          <input
            value={descricao}
            onChange={e =>
              setDescricao(
                e.target.value
              )
            }
          />
        </div>

        <div>
          <label>Preço</label>

          <input
            type="number"
            step="0.01"
            value={preco}
            onChange={e =>
              setPreco(
                Number(
                  e.target.value
                )
              )
            }
            required
          />
        </div>

        <div>
          <label>Duração (min)</label>

          <input
            type="number"
            value={duracaoMinutos}
            onChange={e =>
              setDuracaoMinutos(
                Number(
                  e.target.value
                )
              )
            }
            required
          />
        </div>

        <button type="submit">
          Salvar
        </button>

      </form>

    </div>
  )
}