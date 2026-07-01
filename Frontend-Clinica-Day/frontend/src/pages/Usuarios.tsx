import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

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
   }  catch {
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
    <div>
      <h2>Usuários do Sistema</h2>

      <button
        onClick={() => navigate('/usuarios/novo')}
        style={{ marginBottom: 10 }}
      >
        Novo Usuário
      </button>

      <table border={1} cellPadding={6} width="100%">
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
              <td>{u.Ativo ? 'Ativo' : 'Inativo'}</td>
              <td>
                <button
                  onClick={() => navigate(`/usuarios/editar/${u.Id}`)}
                >
                  Editar
                </button>

                <button
                  style={{ marginLeft: 6 }}
                  onClick={() => alternarStatus(u.Id, u.Ativo)}
                >
                  {u.Ativo ? 'Desativar' : 'Ativar'}
                </button>

                <button
                  style={{ marginLeft: 6 }}
                  onClick={() => redefinirSenha(u.Id)}
                >
                Redefinir Senha
                </button>
               
                <button
                  style={{ marginLeft: 6, color: 'red' }}
                  onClick={() => excluirUsuario(u.Id)}
                >
                Excluir
                </button>

              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
