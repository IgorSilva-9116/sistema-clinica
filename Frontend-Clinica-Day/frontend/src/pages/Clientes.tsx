import { useEffect, useState } from 'react'
import { clienteService } from '../services/clienteService'
import { API_URL } from '../services/api'
import type { Cliente } from '../types/Cliente'
import { useNavigate } from 'react-router-dom'
import { ConviteClienteModal } from '../components/ConviteClienteModal'
import '../styles/clientes.css'

export function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativos' | 'inativos'>('todos')

  const [clienteConvite, setClienteConvite] = useState<Cliente | null>(null)
  const [linkCadastro, setLinkCadastro] = useState<string | null>(null)
  const [linkCopiado, setLinkCopiado] = useState(false)

  const navigate = useNavigate()

  async function carregarClientes() {
    try {
      const response = await clienteService.listar()
      setClientes(response.clientes)
    } catch {
      setErro('Erro ao carregar clientes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarClientes()

    clienteService.obterLinkPublico()
      .then(slug => setLinkCadastro(slug ? `${window.location.origin}/c/${slug}` : null))
      .catch(() => setLinkCadastro(null))
  }, [])

  async function copiarLinkCadastro() {
    if (!linkCadastro) return
    await navigator.clipboard.writeText(linkCadastro)
    setLinkCopiado(true)
    setTimeout(() => setLinkCopiado(false), 2000)
  }

  if (loading) return <p>Carregando clientes...</p>
  if (erro) return <p>{erro}</p>

  const clientesFiltrados = clientes.filter(cliente => {
    const termo = busca.toLowerCase()

    const matchTexto =
      cliente.nome.toLowerCase().includes(termo) ||
      cliente.telefone.toLowerCase().includes(termo) ||
      (cliente.email ?? '').toLowerCase().includes(termo)

    const matchStatus =
      filtroStatus === 'todos' ||
      (filtroStatus === 'ativos' && cliente.ativo === 'Ativo') ||
      (filtroStatus === 'inativos' && cliente.ativo !== 'Ativo')

    return matchTexto && matchStatus
  })

  return (
    <div className="clientes-container">

      <div className="clientes-header">

        <div className="clientes-title">

          <h1>Clientes</h1>

          <p>
            Gerencie os clientes da clínica.
          </p>

        </div>

        <div className="clientes-header-actions">

          {linkCadastro && (
            <button
              className="clientes-btn-secondary"
              onClick={copiarLinkCadastro}
              title={linkCadastro}
            >
              {linkCopiado ? '✅ Link copiado!' : '🔗 Link de cadastro'}
            </button>
          )}

          <button
            className="clientes-btn-secondary"
            onClick={() =>
              navigate('/clientes/aniversariantes')
            }
          >
            🎂 Aniversariantes
          </button>

          <button
            className="clientes-btn-primary"
            onClick={() =>
              navigate('/clientes/novo')
            }
          >
            + Novo Cliente
          </button>

        </div>

      </div>

      <div className="clientes-card">

        <div className="clientes-counter">
          Total de clientes: {clientes.length}
        </div>

        <div className="clientes-filtros">

          <input
            type="text"
            placeholder="Buscar cliente..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="clientes-search"
          />

          <select
            value={filtroStatus}
            onChange={e =>
              setFiltroStatus(
                e.target.value as any
              )
            }
            className="clientes-select"
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


        <table className="clientes-table">
          <thead>
            <tr>
              <th>Foto</th>
              <th>Nome</th>
              <th>Telefone</th>
              <th>Email</th>
              <th>Sexo</th>
              <th>Nascimento</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>

          <tbody>
            {clientesFiltrados.map(cliente => (
              <tr
                key={cliente.id}
                style={{
                  transition: '0.2s'
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >

                {/* ✅ FOTO / AVATAR */}
                <td className="td-foto" data-label="Foto">
                  <img
                    src={
                      cliente.foto
                        ? `${API_URL}/uploads/${cliente.foto}`
                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(cliente.nome)}&background=0D8ABC&color=fff`
                    }
                    alt="Cliente"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid #ddd'
                    }}
                  />
                </td>

                <td className="td-nome" data-label="Nome">{cliente.nome}</td>
                <td data-label="Telefone">{cliente.telefone}</td>
                <td data-label="Email">{cliente.email || '-'}</td>

                <td data-label="Sexo">{cliente.sexo || '-'}</td>

                <td data-label="Nascimento">
                  {cliente.dataNascimento
                    ? new Date(cliente.dataNascimento).toLocaleDateString()
                    : '-'}
                </td>

                <td data-label="Status">
                  {cliente.ativo === 'Ativo' ? (
                    <span className="status-ativo">
                      Ativo
                    </span>
                  ) : (
                    <span className="status-inativo">
                      Inativo
                    </span>
                  )}
                </td>

                <td data-label="Ações">

                  <div className="acoes">

                    <button
                      className="btn-action btn-edit"
                      onClick={() =>
                        navigate(
                          `/clientes/editar/${cliente.id}`
                        )
                      }
                    >
                      Editar
                    </button>

                    <button
                      className="btn-action btn-report"
                      onClick={() =>
                        navigate(
                          `/relatorios/clientes?clienteId=${cliente.id}`
                        )
                      }
                    >
                      Relatórios
                    </button>

                    {cliente.ativo === 'Ativo' && (
                      <button
                        className={`btn-action btn-app ${cliente.acessoApp === 'ATIVO' ? 'btn-app-ativo' : ''}`}
                        title={
                          cliente.acessoApp === 'ATIVO'
                            ? 'Já usa o app — gerar novo link (ex.: esqueceu a senha)'
                            : cliente.acessoApp === 'CONVIDADA'
                              ? 'Convite enviado, ainda não criou a senha'
                              : 'Enviar acesso ao app'
                        }
                        onClick={() => setClienteConvite(cliente)}
                      >
                        {cliente.acessoApp === 'ATIVO'
                          ? '📱 Usa o app'
                          : cliente.acessoApp === 'CONVIDADA'
                            ? '📱 Reenviar'
                            : '📱 Acesso app'}
                      </button>
                    )}

                  </div>

                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {clientesFiltrados.length === 0 && (
        <p>Nenhum cliente encontrado</p>
      )}

      {clienteConvite && (
        <ConviteClienteModal
          cliente={clienteConvite}
          onFechar={() => setClienteConvite(null)}
          onConviteGerado={carregarClientes}
        />
      )}
    </div>

  )
}