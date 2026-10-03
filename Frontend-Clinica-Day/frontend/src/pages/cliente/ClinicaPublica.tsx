import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FiClock, FiLogIn, FiMessageCircle, FiStar, FiUserPlus } from 'react-icons/fi'
import {
  clientePortalService,
  linkWhatsApp,
  salvarSlugClinica,
  type ClinicaPublica as Clinica,
  type ServicoPublico
} from '../../services/clientePortalService'
import { useAuth } from '../../contexts/AuthContext'
import { ClienteTopo } from './ClienteTopo'
import '../../styles/cliente.css'

function formatarPreco(valor: number) {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function ClinicaPublica() {
  const { slug = '' } = useParams()
  const { usuario } = useAuth()

  const [clinica, setClinica] = useState<Clinica | null>(null)
  const [servicos, setServicos] = useState<ServicoPublico[]>([])
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    clientePortalService.obterClinica(slug)
      .then(dados => {
        setClinica(dados.clinica)
        setServicos(dados.servicos)
        salvarSlugClinica(dados.clinica.slug)
      })
      .catch(() => setErro('Clínica não encontrada. Confira o link que você recebeu.'))
  }, [slug])

  if (erro || !clinica) {
    return (
      <div className="cli-page">
        <ClienteTopo />
        <main className="cli-conteudo">
          <div className="cli-card">
            {erro
              ? <div className="cli-alerta cli-alerta-erro" style={{ margin: 0 }}>{erro}</div>
              : <p className="cli-carregando">Carregando…</p>}
          </div>
        </main>
      </div>
    )
  }

  // Agrupa os serviços por categoria, mantendo a ordem do back-end
  const categorias = servicos.reduce<Record<string, ServicoPublico[]>>((grupos, servico) => {
    const nome = servico.categoria || 'Outros serviços'
    ;(grupos[nome] ||= []).push(servico)
    return grupos
  }, {})

  const clienteLogada = usuario?.userTipo === 'cliente'

  return (
    <div className="cli-page">
      <ClienteTopo
        variante="grande"
        titulo="Seu momento de cuidado começa aqui"
        subtitulo="Conheça nossos serviços e agende seu horário pelo celular, quando quiser."
      >
        <div className="cli-topo-botoes">
          {clienteLogada ? (
            <Link to="/cliente" className="cli-btn cli-btn-claro">
              Ir para minha área
            </Link>
          ) : (
            <>
              <Link to={`/c/${slug}/entrar`} className="cli-btn cli-btn-claro">
                <FiLogIn aria-hidden="true" /> Entrar
              </Link>
              <Link to={`/c/${slug}/cadastro`} className="cli-btn cli-btn-contorno">
                <FiUserPlus aria-hidden="true" /> Criar minha conta
              </Link>
            </>
          )}
        </div>
      </ClienteTopo>

      <main className="cli-conteudo cli-conteudo-largo">
        <div className="cli-grade">
          <section className="cli-card">
            <h2>Nossos serviços</h2>
            <p className="cli-card-sub">Valores e duração de cada atendimento</p>

            {servicos.length === 0 && (
              <p className="cli-texto-suave">Nenhum serviço disponível no momento.</p>
            )}

            {Object.entries(categorias).map(([categoria, lista]) => (
              <div key={categoria}>
                <span className="cli-categoria">{categoria}</span>

                {lista.map(servico => (
                  <div className="cli-servico" key={servico.id}>
                    <div className="cli-servico-icone" aria-hidden="true"><FiStar /></div>

                    <div className="cli-servico-info">
                      <div className="cli-servico-nome">{servico.titulo}</div>
                      <div className="cli-servico-detalhe">
                        <FiClock aria-hidden="true" /> {servico.duracaoMinutos} min
                        {servico.descricao && <span>· {servico.descricao}</span>}
                      </div>
                    </div>

                    <div className="cli-servico-preco">{formatarPreco(servico.preco)}</div>
                  </div>
                ))}
              </div>
            ))}
          </section>

          <aside className="cli-grade-lateral">
            <section className="cli-card">
              <h2>Como funciona</h2>
              <p className="cli-card-sub">Simples, rápido e pelo celular</p>

              <ol className="cli-passos">
                <li>
                  <span className="cli-passo-numero">1</span>
                  <div>
                    <strong>Crie sua conta</strong>
                    <span>Nome, celular, data de nascimento e uma senha</span>
                  </div>
                </li>
                <li>
                  <span className="cli-passo-numero">2</span>
                  <div>
                    <strong>Escolha serviço e horário</strong>
                    <span>Veja os horários livres na hora</span>
                  </div>
                </li>
                <li>
                  <span className="cli-passo-numero">3</span>
                  <div>
                    <strong>Aguarde a confirmação</strong>
                    <span>A clínica confirma o seu horário</span>
                  </div>
                </li>
              </ol>
            </section>

            {clinica.telefone && (
              <a
                href={linkWhatsApp(clinica.telefone)}
                target="_blank"
                rel="noreferrer"
                className="cli-btn cli-btn-whatsapp"
              >
                <FiMessageCircle aria-hidden="true" /> Fale conosco
              </a>
            )}
          </aside>
        </div>
      </main>
    </div>
  )
}
