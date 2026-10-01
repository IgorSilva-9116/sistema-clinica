import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { servicoService } from '../services/servicoService'
import type { Servico } from '../types/Servico'
import '../styles/servicos.css'

export function Servicos() {
  const [servicos, setServicos] = useState<Servico[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] =
    useState<'todos' | 'ativos' | 'inativos'>('todos')

  const navigate = useNavigate()

  async function carregar() {
    try {
      const response =
        await servicoService.listarAdmin()

      const servicosValidos =
        (response.servicos || []).filter(
          s =>
            s &&
            s.id &&
            s.titulo &&
            s.preco !== undefined &&
            s.duracaoMinutos !== undefined &&
            s.status
        )

      setServicos(servicosValidos)

    } catch {
      setErro(
        'Erro ao carregar serviços'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  async function toggleStatus(
    servico: Servico
  ) {
    try {

      if (
        servico.status === 'Ativo'
      ) {
        await servicoService.desativar(
          servico.id
        )
      } else {
        await servicoService.ativar(
          servico.id
        )
      }

      carregar()

    } catch {
      setErro(
        'Erro ao alterar status do serviço'
      )
    }
  }

  const servicosFiltrados =
    servicos.filter(servico => {

      const matchBusca =
        servico.titulo
          .toLowerCase()
          .includes(
            busca.toLowerCase()
          ) ||

        (servico.descricao || '')
          .toLowerCase()
          .includes(
            busca.toLowerCase()
          )

      const matchStatus =
        filtroStatus === 'todos' ||

        (
          filtroStatus === 'ativos' &&
          servico.status === 'Ativo'
        ) ||

        (
          filtroStatus === 'inativos' &&
          servico.status !== 'Ativo'
        )

      return (
        matchBusca &&
        matchStatus
      )
    })

  if (loading) {
    return (
      <p>Carregando serviços...</p>
    )
  }

  if (erro) {
    return (
      <p>{erro}</p>
    )
  }

  return (
    <div className="servicos-container">

      <div className="servicos-header">

        <div className="servicos-title">

          <h1>
            Serviços
          </h1>

          <p>
            Gerencie os serviços da clínica.
          </p>

        </div>

        <div className="servicos-header-actions">

          <button
            className="servicos-btn-secondary"
            onClick={() =>
              navigate(
                '/categorias-servico'
              )
            }
          >
            Categorias
          </button>

          <button
            className="servicos-btn-primary"
            onClick={() =>
              navigate(
                '/servicos/novo'
              )
            }
          >
            + Novo Serviço
          </button>

        </div>

      </div>

      <div className="servicos-card">

        <div className="servicos-counter">
          Total de serviços: {servicos.length}
        </div>

        <div className="servicos-filtros">

          <input
            type="text"
            placeholder="Buscar serviço..."
            value={busca}
            onChange={e =>
              setBusca(
                e.target.value
              )
            }
            className="servicos-search"
          />

          <select
            value={filtroStatus}
            onChange={e =>
              setFiltroStatus(
                e.target.value as any
              )
            }
            className="servicos-select"
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

        {servicosFiltrados.length === 0 ? (

          <div className="servicos-empty">
            Nenhum serviço cadastrado.
          </div>

        ) : (

          <table className="servicos-table">

            <thead>

              <tr>
                <th>Categoria</th>
                <th>Serviço</th>
                <th>Preço</th>
                <th>Duração</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>

            </thead>

            <tbody>

              {servicosFiltrados.map(
                servico => (

                  <tr key={servico.id}>

                    <td data-label="Categoria">
                      {servico.categoria || '-'}
                    </td>

                    <td className="td-servico" data-label="Serviço">

                      <strong>
                        {servico.titulo}
                      </strong>

                      <br />

                      <small
                        style={{
                          color: '#666'
                        }}
                      >
                        {
                          servico.descricao ||
                          'Sem descrição'
                        }
                      </small>

                    </td>

                    <td data-label="Preço">
                      R$ {servico.preco}
                    </td>

                    <td data-label="Duração">
                      {
                        servico.duracaoMinutos
                      } min
                    </td>

                    <td data-label="Status">

                      <span
                        className={
                          servico.status === 'Ativo'
                            ? 'status-ativo'
                            : 'status-inativo'
                        }
                      >
                        {servico.status}
                      </span>

                    </td>

                    <td data-label="Ações">

                      <div className="acoes">

                        <button
                          className="btn-action btn-status"
                          onClick={() =>
                            toggleStatus(
                              servico
                            )
                          }
                        >
                          {
                            servico.status === 'Ativo'
                              ? 'Desativar'
                              : 'Ativar'
                          }
                        </button>

                        <button
                          className="btn-action btn-edit"
                          onClick={() =>
                            navigate(
                              `/servicos/editar/${servico.id}`
                            )
                          }
                        >
                          Editar
                        </button>

                      </div>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        )}

      </div>

    </div>
  )
}