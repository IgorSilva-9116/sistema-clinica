import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import '../styles/novoUsuario.css'

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
  const [mostrarSenha, setMostrarSenha] = useState(false)

  useEffect(() => {
    if (usuario && usuario.role !== 'MASTER') {
      navigate('/')
    }
  }, [usuario, navigate])

  useEffect(() => {
    if (!id) return

    async function carregarUsuario() {
      try {
        const resp = await api.get('/usuarios')

        const usuarioEditar = resp.data.find(
          (u: any) => u.Id === Number(id)
        )

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

  async function handleSubmit(
    e: React.FormEvent
  ) {
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
    <div className="novo-usuario-container">

      <div className="novo-usuario-header">

        <div className="novo-usuario-title">

          <h1>
            {id
              ? 'Editar Usuário'
              : 'Novo Usuário'}
          </h1>

          <p>
            Preencha os dados do usuário.
          </p>

        </div>

        <button
          type="button"
          className="btn-voltar"
          onClick={() => navigate('/usuarios')}
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
            Nome
          </label>

          <input
            type="text"
            name="nome"
            value={form.nome}
            onChange={handleChange}
            required
          />

        </div>

        <div className="form-group">

          <label>
            Email
          </label>

          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            disabled={!!id}
          />

        </div>

        <div className="form-group">

          <label>
            Perfil
          </label>

          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            required
          >
            <option value="ADMIN">
              Admin
            </option>

            <option value="SECRETARIA">
              Secretária
            </option>

            <option value="FUNCIONARIO">
              Funcionário
            </option>

          </select>

        </div>

        {!id && (

          <div className="form-group">

            <label>
              Senha
            </label>

            <div className="senha-wrapper">

              <input
                type={
                  mostrarSenha
                    ? 'text'
                    : 'password'
                }
                value={form.senha}
                onChange={(e) =>
                  setForm(prev => ({
                    ...prev,
                    senha: e.target.value
                  }))
                }
                placeholder="Digite a senha"
                required
              />

              <span
                onClick={() =>
                  setMostrarSenha(
                    prev => !prev
                  )
                }
              >
                {mostrarSenha ? '🙈' : '👁'}
              </span>

            </div>

          </div>

        )}

        <div className="form-actions">

          <button
            type="submit"
            className="btn-salvar"
            disabled={loading}
          >
            {
              loading
                ? 'Salvando...'
                : 'Salvar'
            }
          </button>

          <button
            type="button"
            className="btn-cancelar"
            onClick={() =>
              navigate('/usuarios')
            }
          >
            Cancelar
          </button>

        </div>

      </form>

    </div>
  )
}