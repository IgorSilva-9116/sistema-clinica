import { useEffect, useState } from 'react'
import {
  categoriaServicoService,
  type CategoriaServico
} from '../services/categoriaServicoService'

export function CategoriasServico() {

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
      alert('Informe o nome da categoria')
      return
    }

    await categoriaServicoService.criar(nome)

    setNome('')

    carregar()
  }

  async function toggleStatus(
    categoria: CategoriaServico
  ) {

    if (categoria.status === 'Ativo') {

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
          .includes(busca.toLowerCase())

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

      return matchBusca && matchStatus
    })

  if (loading) {
    return <p>Carregando...</p>
  }

  return (
    <div>

      <h2>Categorias de Serviço</h2>

      <div
        style={{
          marginBottom: 20
        }}
      >
        <input
          type="text"
          placeholder="Nova categoria"
          value={nome}
          onChange={e =>
            setNome(e.target.value)
          }
        />

        {' '}

        <button onClick={salvar}>
          Salvar
        </button>
      </div>

      <input
        type="text"
        placeholder="Buscar categoria..."
        value={busca}
        onChange={e =>
          setBusca(e.target.value)
        }
      />

      <select
        value={filtroStatus}
        onChange={e =>
          setFiltroStatus(
            e.target.value as
            'todos' |
            'ativos' |
            'inativos'
          )
        }
        style={{
          marginLeft: 10
        }}
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

      <table
        border={1}
        cellPadding={8}
        style={{
          marginTop: 15
        }}
      >
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

                {c.status === 'Ativo'
                  ? (
                    <span
                      style={{
                        color: 'green',
                        fontWeight: 'bold'
                      }}
                    >
                      Ativo
                    </span>
                  )
                  : (
                    <span
                      style={{
                        color: 'red',
                        fontWeight: 'bold'
                      }}
                    >
                      Inativo
                    </span>
                  )}

              </td>

              <td>

                <button
                  onClick={() =>
                    toggleStatus(c)
                  }
                >
                  {c.status === 'Ativo'
                    ? 'Desativar'
                    : 'Ativar'}
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  )
}