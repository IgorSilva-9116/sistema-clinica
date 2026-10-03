import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  clientePortalService,
  formatarTelefone,
  salvarSlugClinica,
  type ConviteCliente,
  senhaClienteValida,
  MENSAGEM_SENHA_CLIENTE
} from '../../services/clientePortalService'
import { CampoSenha } from './CampoSenha'
import { ClienteTopo } from './ClienteTopo'
import '../../styles/cliente.css'

// Tela aberta pelo link que a clínica envia no WhatsApp
export function AtivarConvite() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const navigate = useNavigate()
  const { iniciarSessao } = useAuth()

  const [convite, setConvite] = useState<ConviteCliente | null>(null)
  const [linkInvalido, setLinkInvalido] = useState(false)

  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!token) {
      setLinkInvalido(true)
      return
    }

    clientePortalService.obterConvite(token)
      .then(setConvite)
      .catch(() => setLinkInvalido(true))
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)

    if (!senhaClienteValida(senha)) {
      setErro(MENSAGEM_SENHA_CLIENTE)
      return
    }

    if (senha !== confirmarSenha) {
      setErro('As senhas não são iguais')
      return
    }

    setEnviando(true)

    try {
      const sessao = await clientePortalService.ativarConvite(token, senha, dataNascimento || undefined)
      salvarSlugClinica(sessao.slug)
      iniciarSessao(sessao.token, sessao.usuario)
      navigate('/cliente')
    } catch {
      setErro('Não foi possível criar sua senha. O link pode ter expirado.')
    } finally {
      setEnviando(false)
    }
  }

  const primeiroNome = convite?.nome.split(' ')[0]

  return (
    <div className="cli-page">
      <ClienteTopo
        titulo={convite ? `Olá, ${primeiroNome}!` : 'Boas-vindas!'}
        subtitulo={convite ? 'Crie sua senha para acessar sua conta' : undefined}
      />

      <main className="cli-conteudo">
        {linkInvalido && (
          <div className="cli-alerta cli-alerta-erro">
            Este link expirou ou já foi usado. Peça um novo link para a clínica.
          </div>
        )}

        {!linkInvalido && !convite && <div className="cli-card"><p className="cli-carregando">Carregando…</p></div>}

        {convite && (
          <form className="cli-card" onSubmit={handleSubmit}>
            <p style={{ marginTop: 0 }}>
              Crie uma senha para acessar sua conta. Depois é só entrar com
              {convite.telefone
                ? <> o seu celular <strong>{formatarTelefone(convite.telefone)}</strong></>
                : <> o seu e-mail <strong>{convite.email}</strong></>}
              {' '}e essa senha.
            </p>

            {erro && <div className="cli-alerta cli-alerta-erro">{erro}</div>}

            {convite.precisaDataNascimento && (
              <div className="cli-campo">
                <label htmlFor="nascimento">Data de nascimento</label>
                <input
                  id="nascimento"
                  type="date"
                  value={dataNascimento}
                  onChange={e => setDataNascimento(e.target.value)}
                  required
                />
                <span className="cli-dica">Para lembrarmos de você no seu aniversário</span>
              </div>
            )}

            <CampoSenha
              id="senha"
              label="Crie uma senha"
              value={senha}
              onChange={setSenha}
              autoComplete="new-password"
              dica="Mínimo 8 caracteres, com letras e números"
            />

            <CampoSenha
              id="confirmar"
              label="Repita a senha"
              value={confirmarSenha}
              onChange={setConfirmarSenha}
              autoComplete="new-password"
            />

            <button type="submit" className="cli-btn cli-btn-primario" disabled={enviando}>
              {enviando ? 'Salvando…' : 'Criar senha e entrar'}
            </button>
          </form>
        )}
      </main>
    </div>
  )
}
