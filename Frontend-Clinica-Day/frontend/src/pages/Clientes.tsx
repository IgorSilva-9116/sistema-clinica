import { useEffect, useState } from 'react'
import { clienteService } from '../services/clienteService'
import type { Cliente } from '../types/Cliente'
import { useNavigate } from 'react-router-dom'

export function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativos' | 'inativos'>('todos')

  const navigate = useNavigate()

  useEffect(() => {
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

    carregarClientes()
  }, [])

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
    <div>
      <h2>Clientes</h2>

      <input
        type="text"
        placeholder="Buscar cliente..."
        value={busca}
        onChange={e => setBusca(e.target.value)}
        style={{ marginBottom: 10, width: 250 }}
      />

      <select
        value={filtroStatus}
        onChange={e => setFiltroStatus(e.target.value as any)}
        style={{ marginLeft: 10 }}
      >
        <option value="todos">Todos</option>
        <option value="ativos">Ativos</option>
        <option value="inativos">Inativos</option>
      </select>

      <table border={1} cellPadding={8} style={{ marginTop: 15 }}>
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
              <td>
                <img
                  src={
                    cliente.foto
                      ? `http://localhost:3000/uploads/${cliente.foto}`
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

              <td>{cliente.nome}</td>
              <td>{cliente.telefone}</td>
              <td>{cliente.email || '-'}</td>

              <td>{cliente.sexo || '-'}</td>

              <td>
                {cliente.dataNascimento
                  ? new Date(cliente.dataNascimento).toLocaleDateString()
                  : '-'}
              </td>

              <td>
                {cliente.ativo === 'Ativo' ? (
                  <span style={{ color: 'green', fontWeight: 'bold' }}>
                    Ativo
                  </span>
                ) : (
                  <span style={{ color: 'red', fontWeight: 'bold' }}>
                    Inativo
                  </span>
                )}
              </td>

              <td>
                <button
                  onClick={() => navigate(`/clientes/editar/${cliente.id}`)}
                >
                  Editar
                </button>

                <button
                  style={{ marginLeft: 6 }}
                  onClick={() =>
                    navigate(`/relatorios/clientes?clienteId=${cliente.id}`)
                  }
                >
                  Relatórios
                </button>
              </td>

            </tr>
          ))}
        </tbody>
      </table>

      {clientesFiltrados.length === 0 && (
        <p>Nenhum cliente encontrado</p>
      )}
    </div>
  )
}