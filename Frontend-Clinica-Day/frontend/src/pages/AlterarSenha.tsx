import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

export default function AlterarSenha() {
  const navigate = useNavigate()
  const { usuario, setUsuario } = useAuth()

  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false)

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

    if (!senha || !confirmarSenha) {
      setErro('Preencha todos os campos')
      return
    }

    if (senha !== confirmarSenha) {
      setErro('Senhas não coincidem')
      return
    }

    if (!senhaForte(senha)) {
      setErro('A senha deve ter no mínimo 8 caracteres, maiúscula, minúscula, número e especial')
      return
    }

    if (!usuario?.id) {
      setErro('Usuário inválido')
      return
    }

    setLoading(true)

    try {
      await api.patch(`/usuarios/${usuario.id}/senha`, {
        novaSenha: senha
      })

      // ✅ atualiza contexto corretamente
      const usuarioAtualizado = {
        ...usuario,
        precisaTrocarSenha: false
      }

      sessionStorage.setItem('usuario', JSON.stringify(usuarioAtualizado))
      setUsuario(usuarioAtualizado)

      navigate('/')

    } catch (error: any) {
      console.log(error)
      setErro(error?.response?.data?.mensagem || 'Erro ao alterar senha')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2>Alterar senha</h2>

      <p>Por segurança, você precisa definir uma nova senha.</p>

      {erro && <p style={{ color: 'red' }}>{erro}</p>}

      <form onSubmit={handleSubmit}>

        {/* NOVA SENHA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <input
            type={mostrarSenha ? 'text' : 'password'}
            placeholder="Nova senha"
            value={senha}
            onChange={e => setSenha(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setMostrarSenha(prev => !prev)}
          >
            👁
          </button>
        </div>

        {/* CONFIRMAR SENHA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <input
            type={mostrarConfirmar ? 'text' : 'password'}
            placeholder="Confirmar senha"
            value={confirmarSenha}
            onChange={e => setConfirmarSenha(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setMostrarConfirmar(prev => !prev)}
          >
            👁
          </button>
        </div>

        <button disabled={loading}>
          {loading ? 'Salvando...' : 'Alterar senha'}
        </button>
      </form>
    </div>
  )
}
