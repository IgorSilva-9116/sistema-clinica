import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import '../styles/usuarios.css'

type Usuario = {
  Id: number
  Nome: string
  Email: string
  Role: string
  Ativo: boolean
}

export function Usuarios() {
  const navigate = useNavigate()
  const { usuario } = useAuth()

  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  // 🔒 Proteção frontend
  useEffect(() => {
    if (usuario && usuario.role !== 'MASTER') {
      navigate('/')
    }
  }, [usuario, navigate])

  useEffect(() => {
    carregarUsuarios()
  }, [])

  async function carregarUsuarios() {
    try {
      const response = await api.get('/usuarios')
      setUsuarios(response.data)
    } catch {
      setErro('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  async function alternarStatus(id: number, ativoAtual: boolean) {
    try {
      await api.patch(`/usuarios/${id}/status`, {
        ativo: !ativoAtual
      })
      carregarUsuarios()
    } catch {
      alert('Erro ao alterar status do usuário')
    }
  }

  async function redefinirSenha(id: number) {
    const novaSenha = prompt('Digite a nova senha do usuário:')

    if (!novaSenha) return

    try {
      await api.patch(`/usuarios/${id}/senha`, {
        novaSenha
      })
      alert('Senha redefinida com sucesso')
    } catch {
      alert('Erro ao redefinir senha')
    }
  }

  async function excluirUsuario(id: number) {
    const confirmar = confirm('Deseja realmente excluir este usuário?')

    if (!confirmar) return

    try {
      await api.delete(`/usuarios/${id}`)

      // ✅ remove da lista local imediatamente (melhor UX)
      setUsuarios(prev => prev.filter(u => u.Id !== id))

      alert('Usuário excluído com sucesso')

    } catch (error: any) {
      alert(error?.response?.data?.mensagem || 'Erro ao excluir usuário')
    }
  }

  if (loading) return <p>Carregando usuários...</p>
  if (erro) return <p>{erro}</p>


  return (
    <div className="usuarios-container">

      <div className="usuarios-header">

        <div className="usuarios-title">

          <h1>
            Usuários do Sistema
          </h1>

          <p>
            Gerencie usuários e permissões de acesso.
          </p>

        </div>

        <button
          className="usuarios-btn"
          onClick={() => navigate('/usuarios/novo')}
        >
          + Novo Usuário
        </button>

      </div>

      <div className="usuarios-card">

        <div className="usuarios-counter">

          Total de usuários: {usuarios.length}

        </div>

        <table className="usuarios-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Perfil</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.length === 0 && (
              <tr>
                <td colSpan={5}>Nenhum usuário encontrado</td>
              </tr>
            )}

            {usuarios.map(u => (
              <tr key={u.Id}>
                <td>{u.Nome || '-'}</td>
                <td>{u.Email}</td>
                <td>{u.Role}</td>
                <td>

                  <span
                    className={
                      u.Ativo
                        ? 'status-ativo'
                        : 'status-inativo'
                    }
                  >
                    {u.Ativo ? 'Ativo' : 'Inativo'}
                  </span>

                </td>
                <td>

                  <div className="acoes">

                    <button
                      className="btn-action btn-edit"
                      onClick={() =>
                        navigate(`/usuarios/editar/${u.Id}`)
                      }
                    >
                      Editar
                    </button>

                    <button
                      className="btn-action btn-status"
                      onClick={() =>
                        alternarStatus(
                          u.Id,
                          u.Ativo
                        )
                      }
                    >
                      {u.Ativo
                        ? 'Desativar'
                        : 'Ativar'}
                    </button>

                    <button
                      className="btn-action btn-password"
                      onClick={() =>
                        redefinirSenha(u.Id)
                      }
                    >
                      Redefinir Senha
                    </button>

                    <button
                      className="btn-action btn-delete"
                      onClick={() =>
                        excluirUsuario(u.Id)
                      }
                    >
                      Excluir
                    </button>

                  </div>

                </td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>

    </div>
  )
}
