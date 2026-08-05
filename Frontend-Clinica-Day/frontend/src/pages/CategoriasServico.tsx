import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  categoriaServicoService,
  type CategoriaServico
} from '../services/categoriaServicoService'

import '../styles/categoriasServico.css'

export function CategoriasServico() {

  const navigate = useNavigate()

  const [categorias, setCategorias] =
    useState<CategoriaServico[]>([])

  const [busca, setBusca] = useState('')

  const [nome, setNome] = useState('')

  const [loading, setLoading] = useState(true)

  const [filtroStatus, setFiltroStatus] = useState<
    'todos' | 'ativos' | 'inativos'
  >('todos')

  async function carregar() {

    try {

      const response =
        await categoriaServicoService.listar()

      setCategorias(
        response.categorias || []
      )

    } finally {

      setLoading(false)

    }

  }

  useEffect(() => {
    carregar()
  }, [])

  async function salvar() {

    if (!nome.trim()) {

      alert(
        'Informe o nome da categoria'
      )

      return

    }

    await categoriaServicoService.criar(nome)

    setNome('')

    carregar()
  }

  async function toggleStatus(
    categoria: CategoriaServico
  ) {

    if (
      categoria.status === 'Ativo'
    ) {

      await categoriaServicoService
        .desativar(categoria.id)

    } else {

      await categoriaServicoService
        .ativar(categoria.id)

    }

    carregar()
  }

  const categoriasFiltradas =
    categorias.filter(c => {

      const matchBusca =
        c.nome
          .toLowerCase()
          .includes(
            busca.toLowerCase()
          )

      const matchStatus =
        filtroStatus === 'todos' ||

        (
          filtroStatus === 'ativos' &&
          c.status === 'Ativo'
        ) ||

        (
          filtroStatus === 'inativos' &&
          c.status !== 'Ativo'
        )

      return (
        matchBusca &&
        matchStatus
      )

    })

  if (loading) {
    return (
      <p>Carregando...</p>
    )
  }

  return (

    <div className="categorias-container">

      <div className="categorias-header">

        <div className="categorias-title">

          <h1>
            Categorias de Serviço
          </h1>

          <p>
            Gerencie as categorias utilizadas nos serviços.
          </p>

        </div>

        <button
          className="btn-voltar"
          onClick={() =>
            navigate('/servicos')
          }
        >
          Voltar
        </button>

      </div>

      <div className="categorias-card">

        <div className="categoria-nova">

          <input
            type="text"
            placeholder="Nova categoria"
            value={nome}
            onChange={e =>
              setNome(
                e.target.value
              )
            }
            className="categoria-input"
          />

          <button
            className="btn-salvar-categoria"
            onClick={salvar}
          >
            Salvar
          </button>

        </div>

        <div className="categorias-counter">
          Total de categorias: {categorias.length}
        </div>

        <div className="categorias-filtros">

          <input
            type="text"
            placeholder="Buscar categoria..."
            value={busca}
            onChange={e =>
              setBusca(
                e.target.value
              )
            }
            className="categorias-search"
          />

          <select
            value={filtroStatus}
            onChange={e =>
              setFiltroStatus(
                e.target
                  .value as
                  | 'todos'
                  | 'ativos'
                  | 'inativos'
              )
            }
            className="categorias-select"
          >
            <option value="todos">
              Todos
            </option>

            <option value="ativos">
              Ativos
            </option>

            <option value="inativos">
              Inativos
            </option>

          </select>

        </div>

        {categoriasFiltradas.length === 0 ? (

          <div className="categorias-empty">
            Nenhuma categoria encontrada.
          </div>

        ) : (

          <table className="categorias-table">

            <thead>

              <tr>
                <th>Categoria</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>

            </thead>

            <tbody>

              {categoriasFiltradas.map(c => (

                <tr key={c.id}>

                  <td>
                    {c.nome}
                  </td>

                  <td>

                    <span
                      className={
                        c.status === 'Ativo'
                          ? 'status-ativo'
                          : 'status-inativo'
                      }
                    >
                      {c.status}
                    </span>

                  </td>

                  <td>

                    <div className="acoes">

                      <button
                        className="btn-action btn-status"
                        onClick={() =>
                          toggleStatus(c)
                        }
                      >
                        {
                          c.status === 'Ativo'
                            ? 'Desativar'
                            : 'Ativar'
                        }
                      </button>

                    </div>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        )}

      </div>

    </div>

  )
}