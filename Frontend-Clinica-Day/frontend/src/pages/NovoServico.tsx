import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { servicoService } from '../services/servicoService'
import {
  categoriaServicoService,
  type CategoriaServico
} from '../services/categoriaServicoService'

import '../styles/novoServico.css'

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

    <div className="novo-servico-container">

      <div className="novo-servico-header">

        <div className="novo-servico-title">

          <h1>
            Novo Serviço
          </h1>

          <p>
            Preencha os dados do serviço.
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

          <label>Título</label>

          <input
            value={titulo}
            onChange={e =>
              setTitulo(e.target.value)
            }
            required
          />

        </div>

        <div className="form-group">

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
            Salvar
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