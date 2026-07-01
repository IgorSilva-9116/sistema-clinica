import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

type UsuarioForm = {
  nome: string
  email: string
  role: string
  senha: string
}

export function NovoUsuario() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { usuario } = useAuth()

  const [form, setForm] = useState<UsuarioForm>({
    nome: '',
    email: '',
    role: 'SECRETARIA',
    senha: ''
  })

  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const [mostrarSenha, setMostrarSenha] = useState(false) // ✅ NOVO

  // 🔒 Proteção frontend
  useEffect(() => {
    if (usuario && usuario.role !== 'MASTER') {
      navigate('/')
    }
  }, [usuario, navigate])

  // 🔁 Carregar usuário (edição)
  useEffect(() => {
    if (!id) return

    async function carregarUsuario() {
      try {
        const resp = await api.get('/usuarios')
        const usuarioEditar = resp.data.find((u: any) => u.Id === Number(id))

        if (!usuarioEditar) {
          setErro('Usuário não encontrado')
          return
        }

        setForm({
          nome: usuarioEditar.Nome || '',
          email: usuarioEditar.Email,
          role: usuarioEditar.Role,
          senha: ''
        })
      } catch {
        setErro('Erro ao carregar usuário')
      }
    }

    carregarUsuario()
  }, [id])

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro(null)

    try {
      if (id) {
        await api.put(`/usuarios/${id}`, {
          nome: form.nome,
          email: form.email,
          role: form.role
        })
      } else {
        await api.post('/usuarios/clinica', {
          nome: form.nome,
          email: form.email,
          senha: form.senha,
          role: form.role
        })
      }

      navigate('/usuarios')

    } catch {
      setErro('Erro ao salvar usuário')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2>{id ? 'Editar Usuário' : 'Novo Usuário'}</h2>

      {erro && <p>{erro}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>Nome</label><br />
          <input
            type="text"
            name="nome"
            value={form.nome}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Email</label><br />
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            disabled={!!id}
          />
        </div>

        <div>
          <label>Perfil</label><br />
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            required
          >
            <option value="ADMIN">Admin</option>
            <option value="SECRETARIA">Secretária</option>
            <option value="FUNCIONARIO">Funcionário</option>
          </select>
        </div>

        {/* ✅ SENHA COM ÍCONE */}
        {!id && (
          <div>
            <label>Senha</label><br />

            <div style={{ position: 'relative', display: 'inline-block' }}>
              <input
                type={mostrarSenha ? 'text' : 'password'}
                value={form.senha}
                onChange={(e) =>
                  setForm(prev => ({ ...prev, senha: e.target.value }))
                }
                placeholder="Senha"
                required
                style={{ paddingRight: 30 }}
              />

              <span
                onClick={() => setMostrarSenha(prev => !prev)}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                {mostrarSenha ? '🙈' : '👁'}
              </span>
            </div>
          </div>
        )}

        <button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar'}
        </button>

        <button
          type="button"
          style={{ marginLeft: 10 }}
          onClick={() => navigate('/usuarios')}
        >
          Cancelar
        </button>
      </form>
    </div>
  )
}