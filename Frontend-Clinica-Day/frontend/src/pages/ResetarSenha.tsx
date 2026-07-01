import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../services/api'

export default function ResetarSenha() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const token = searchParams.get('token')

  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)
  const [loading, setLoading] = useState(false)

  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false)

  useEffect(() => {
    if (!token) {
      setErro('Link inválido ou expirado')
    }
  }, [token])

  function senhaForte(valor: string) {
    return (
      valor.length >= 8 &&
      /[A-Z]/.test(valor) &&
      /[a-z]/.test(valor) &&
      /\d/.test(valor) &&
      /[^A-Za-z0-9]/.test(valor)
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)

    if (!token) {
      setErro('Token inválido')
      return
    }

    if (!senha || !confirmarSenha) {
      setErro('Preencha todos os campos')
      return
    }

    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem')
      return
    }

    if (!senhaForte(senha)) {
      setErro(
        'A senha deve ter no mínimo 8 caracteres, letra maiúscula, minúscula, número e caractere especial'
      )
      return
    }

    setLoading(true)

    try {
      await api.post('/auth/resetar-senha', {
        token,
        novaSenha: senha
      })

      setSucesso(true)

      setTimeout(() => {
        navigate('/login')
      }, 2000)

    } catch {
      setErro('Erro ao redefinir senha. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2>Redefinir senha</h2>

      {erro && <p style={{ color: 'red' }}>{erro}</p>}

      {sucesso ? (
        <p style={{ color: 'green' }}>
          Senha redefinida com sucesso. Redirecionando para o login…
        </p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div>
            <label>Nova senha</label><br />

            {/* ✅ SENHA COM ÍCONE */}
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
                  cursor: 'pointer'
                }}
              >
                {mostrarSenha ? '🙈' : '👁'}
              </span>
            </div>
          </div>

          <div>
            <label>Confirmar nova senha</label><br />

            {/* ✅ CONFIRMAÇÃO COM ÍCONE */}
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <input
                type={mostrarConfirmar ? 'text' : 'password'}
                value={confirmarSenha}
                onChange={e => setConfirmarSenha(e.target.value)}
                required
                style={{ paddingRight: 30 }}
              />

              <span
                onClick={() => setMostrarConfirmar(prev => !prev)}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  cursor: 'pointer'
                }}
              >
                {mostrarConfirmar ? '🙈' : '👁'}
              </span>
            </div>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Salvando…' : 'Redefinir senha'}
          </button>
        </form>
      )}
    </div>
  )
}