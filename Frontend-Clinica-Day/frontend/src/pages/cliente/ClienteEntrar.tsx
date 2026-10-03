import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  clientePortalService,
  linkWhatsApp,
  salvarSlugClinica
} from '../../services/clientePortalService'
import { CampoSenha } from './CampoSenha'
import { ClienteTopo } from './ClienteTopo'
import '../../styles/cliente.css'

export function ClienteEntrar() {
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const { login } = useAuth()

  const [usuarioLogin, setUsuarioLogin] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [telefoneClinica, setTelefoneClinica] = useState<string | null>(null)

  // Telefone da clínica para o "Esqueceu a senha?" (novo link pelo WhatsApp)
  useEffect(() => {
    clientePortalService.obterClinica(slug)
      .then(dados => setTelefoneClinica(dados.clinica.telefone || null))
      .catch(() => setTelefoneClinica(null))
  }, [slug])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)

    try {
      await login(usuarioLogin.trim(), senha)
      salvarSlugClinica(slug)

      const usuario = JSON.parse(sessionStorage.getItem('usuario') || '{}')
      navigate(usuario.userTipo === 'cliente' ? '/cliente' : '/')
    } catch {
      setErro('Celular, e-mail ou senha incorretos.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="cli-page">
      <ClienteTopo titulo="Entrar" subtitulo="Acesse sua conta para agendar" />

      <main className="cli-conteudo">
        <form className="cli-card" onSubmit={handleSubmit}>
          {erro && <div className="cli-alerta cli-alerta-erro">{erro}</div>}

          <div className="cli-campo">
            <label htmlFor="login">Celular ou e-mail</label>
            <input
              id="login"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              placeholder="(32) 98888-7777"
              value={usuarioLogin}
              onChange={e => setUsuarioLogin(e.target.value)}
              required
            />
          </div>

          <CampoSenha
            id="senha"
            label="Senha"
            value={senha}
            onChange={setSenha}
            autoComplete="current-password"
          />

          <button type="submit" className="cli-btn cli-btn-primario" disabled={enviando}>
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>

          {telefoneClinica && (
            <p className="cli-rodape" style={{ marginBottom: 0 }}>
              <a
                className="cli-link"
                href={linkWhatsApp(telefoneClinica, 'Olá! Esqueci minha senha do app da clínica. Pode me enviar um novo link?')}
                target="_blank"
                rel="noreferrer"
              >
                Esqueceu a senha? Fale conosco
              </a>
            </p>
          )}
        </form>

        <p className="cli-rodape">
          Ainda não tem conta?{' '}
          <Link to={`/c/${slug}/cadastro`} className="cli-link">Criar minha conta</Link>
        </p>
        <p className="cli-rodape">
          <Link to={`/c/${slug}`} className="cli-link">← Voltar</Link>
        </p>
      </main>
    </div>
  )
}
