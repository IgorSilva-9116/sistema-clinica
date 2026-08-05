import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { servicoService } from '../services/servicoService'

import '../styles/novoServico.css'

import {
  categoriaServicoService,
  type CategoriaServico
} from '../services/categoriaServicoService'

export function EditarServico() {

  const { id } = useParams()

  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [preco, setPreco] = useState<number>(0)
  const [duracaoMinutos, setDuracaoMinutos] =
    useState<number>(0)

  const [categoriaServicoId, setCategoriaServicoId] =
    useState('')

  const [categorias, setCategorias] =
    useState<CategoriaServico[]>([])

  useEffect(() => {

    async function carregar() {

      try {

        if (!id) return

        const responseCategorias =
          await categoriaServicoService.listar()

        setCategorias(
          responseCategorias.categorias || []
        )

        const servico =
          await servicoService.buscarPorId(
            Number(id)
          )

        if (!servico) {

          setErro(
            'Serviço não encontrado'
          )

          return
        }

        setTitulo(servico.titulo)

        setDescricao(
          servico.descricao || ''
        )

        setPreco(servico.preco)

        setDuracaoMinutos(
          servico.duracaoMinutos
        )

        setCategoriaServicoId(
          servico.categoriaServicoId
            ? String(
              servico.categoriaServicoId
            )
            : ''
        )

      } catch {

        setErro(
          'Erro ao carregar serviço'
        )

      } finally {

        setLoading(false)

      }
    }

    carregar()

  }, [id])

  async function handleSubmit(
    e: React.FormEvent
  ) {

    e.preventDefault()

    setErro(null)

    try {

      if (!id) return

      await servicoService.atualizar(
        Number(id),
        {
          titulo,
          descricao,
          preco,
          duracaoMinutos,
          categoriaServicoId:
            categoriaServicoId
              ? Number(categoriaServicoId)
              : null
        }
      )

      navigate('/servicos')

    } catch {

      setErro(
        'Erro ao atualizar serviço'
      )

    }
  }

  if (loading) {
    return <p>Carregando serviço...</p>
  }

  if (erro) {
    return (
      <div className="erro-card">
        {erro}
      </div>
    )
  }

  return (

    <div className="novo-servico-container">

      <div className="novo-servico-header">

        <div className="novo-servico-title">

          <h1>
            Editar Serviço
          </h1>

          <p>
            Atualize os dados do serviço.
          </p>

        </div>

        <button
          type="button"
          className="btn-voltar"
          onClick={() =>
            navigate('/servicos')
          }
        >
          Voltar
        </button>

      </div>

      {erro && (
        <div className="erro-card">
          {erro}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="form-card"
      >

        <div className="form-group">

          <label>
            Título
          </label>

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

        <div className="form-group">

          <label>
            Categoria
          </label>

          <select
            value={categoriaServicoId}
            onChange={e =>
              setCategoriaServicoId(
                e.target.value
              )
            }
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

        <div className="form-group">

          <label>
            Descrição
          </label>

          <textarea
            value={descricao}
            onChange={e =>
              setDescricao(
                e.target.value
              )
            }
            placeholder="Descrição do serviço..."
          />

        </div>

        <div className="form-group">

          <label>
            Preço
          </label>

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

        <div className="form-group">

          <label>
            Duração (min)
          </label>

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

        <div className="form-actions">

          <button
            type="submit"
            className="btn-salvar"
          >
            Salvar Alterações
          </button>

          <button
            type="button"
            className="btn-cancelar"
            onClick={() =>
              navigate('/servicos')
            }
          >
            Cancelar
          </button>

        </div>

      </form>

    </div>

  )
}