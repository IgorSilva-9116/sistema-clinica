import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../../contexts/AuthContext'
import {
  clientePortalService,
  linkWhatsApp,
  salvarSlugClinica,
  senhaClienteValida,
  MENSAGEM_SENHA_CLIENTE
} from '../../services/clientePortalService'
import { CampoSenha } from './CampoSenha'
import { ClienteTopo } from './ClienteTopo'
import '../../styles/cliente.css'

interface ErroCadastro {
  mensagem: string
  codigo?: 'JA_TEM_CONTA' | 'JA_E_CLIENTE'
  telefoneClinica?: string
}

export function ClienteCadastro() {
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const { iniciarSessao } = useAuth()

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')

  const [erro, setErro] = useState<ErroCadastro | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)

    if (!senhaClienteValida(senha)) {
      setErro({ mensagem: MENSAGEM_SENHA_CLIENTE })
      return
    }

    if (senha !== confirmarSenha) {
      setErro({ mensagem: 'As senhas não são iguais' })
      return
    }

    setEnviando(true)

    try {
      const sessao = await clientePortalService.cadastrar(slug, {
        nome,
        email: email.trim() || undefined,
        telefone,
        dataNascimento,
        senha
      })

      salvarSlugClinica(slug)
      iniciarSessao(sessao.token, sessao.usuario)
      navigate('/cliente')
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.mensagem) {
        setErro(error.response.data as ErroCadastro)
      } else {
        setErro({ mensagem: 'Não foi possível criar sua conta. Tente novamente.' })
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="cli-page">
      <ClienteTopo titulo="Criar minha conta" subtitulo="Leva menos de um minuto" />

      <main className="cli-conteudo">
        <form className="cli-card" onSubmit={handleSubmit}>
          {erro && (
            <div className="cli-alerta cli-alerta-erro">
              {erro.mensagem}

              {erro.codigo === 'JA_TEM_CONTA' && (
                <div style={{ marginTop: 10 }}>
                  <Link to={`/c/${slug}/entrar`} className="cli-link">Entrar na minha conta</Link>
                </div>
              )}

              {erro.codigo === 'JA_E_CLIENTE' && erro.telefoneClinica && (
                <a
                  href={linkWhatsApp(erro.telefoneClinica, 'Olá! Quero receber meu link de acesso ao app da clínica.')}
                  target="_blank"
                  rel="noreferrer"
                  className="cli-btn cli-btn-whatsapp"
                  style={{ marginTop: 12 }}
                >
                  Pedir meu link no WhatsApp
                </a>
              )}
            </div>
          )}

          <div className="cli-campo">
            <label htmlFor="nome">Nome completo</label>
            <input id="nome" autoComplete="name" value={nome} onChange={e => setNome(e.target.value)} required />
          </div>

          <div className="cli-campo">
            <label htmlFor="telefone">Celular (WhatsApp)</label>
            <input
              id="telefone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(32) 99999-9999"
              value={telefone}
              onChange={e => setTelefone(e.target.value)}
              required
            />
            <span className="cli-dica">Você vai usar o seu celular para entrar</span>
          </div>

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

          <div className="cli-campo">
            <label htmlFor="email">E-mail (opcional)</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

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
            {enviando ? 'Criando conta…' : 'Criar minha conta'}
          </button>
        </form>

        <p className="cli-rodape">
          Já tem conta? <Link to={`/c/${slug}/entrar`} className="cli-link">Entrar</Link>
        </p>
      </main>
    </div>
  )
}
