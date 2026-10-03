import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

export function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [mostrarSenha, setMostrarSenha] = useState(false) // ✅ NOVO

  const [mostrarEsqueceuSenha, setMostrarEsqueceuSenha] = useState(false)
  const [emailReset, setEmailReset] = useState('')
  const [mensagemReset, setMensagemReset] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setLoading(true)

    try {
      const response = await api.post('/login', {
        email,
        senha
      })

      if (response.data.usuario?.precisaTrocarSenha) {
        await login(email, senha)
        navigate('/alterar-senha')
        return
      }

      await login(email, senha)
      navigate(response.data.usuario?.userTipo === 'cliente' ? '/cliente' : '/')

    } catch {
      setErro('Email ou senha inválidos')
    } finally {
      setLoading(false)
    }
  }

  async function handleEsqueceuSenha(e: React.FormEvent) {
    e.preventDefault()
    setMensagemReset(null)

    try {
      await api.post('/auth/esqueceu-senha', {
        email: emailReset
      })

      setMensagemReset(
        'Se o email existir, enviaremos instruções para redefinir a senha.'
      )

    } catch {
      setMensagemReset(
        'Se o email existir, enviaremos instruções para redefinir a senha.'
      )
    }
  }

  return (
    <div>
      <h2>Login</h2>

      {erro && <p style={{ color: 'red' }}>{erro}</p>}

      {!mostrarEsqueceuSenha ? (
        <form onSubmit={handleSubmit}>
          <div>
            <label>Email</label><br />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label>Senha</label><br />

            {/* ✅ INPUT COM ÍCONE DENTRO */}
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <input
                type={mostrarSenha ? 'text' : 'password'}
                value={senha}
                onChange={e => setSenha(e.target.value)}
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

          <button type="submit" disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>

          <div style={{ marginTop: 10 }}>
            <button
              type="button"
              onClick={() => setMostrarEsqueceuSenha(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'blue',
                cursor: 'pointer',
                padding: 0
              }}
            >
              Esqueceu sua senha?
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleEsqueceuSenha}>
          <p>Informe seu email para redefinir a senha</p>

          <input
            type="email"
            value={emailReset}
            onChange={e => setEmailReset(e.target.value)}
            required
          />

          <button type="submit">Enviar</button>

          <button
            type="button"
            style={{ marginLeft: 10 }}
            onClick={() => {
              setMostrarEsqueceuSenha(false)
              setMensagemReset(null)
            }}
          >
            Voltar
          </button>

          {mensagemReset && (
            <p style={{ marginTop: 10 }}>{mensagemReset}</p>
          )}
        </form>
      )}
    </div>
  )
}