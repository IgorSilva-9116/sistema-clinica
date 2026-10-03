import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiBell, FiCalendar, FiChevronRight, FiList, FiMessageCircle, FiUser } from 'react-icons/fi'
import { clientePortalService, linkWhatsApp, type Notificacao } from '../../services/clientePortalService'
import { useCliente } from './useCliente'

interface ItemMenuProps {
  icone: ReactNode
  titulo: string
  descricao: string
  contador?: number
  onClick?: () => void
}

function ItemMenu({ icone, titulo, descricao, contador, onClick }: ItemMenuProps) {
  return (
    <button type="button" className="cli-menu-item" onClick={onClick}>
      <span className="cli-menu-icone" aria-hidden="true">{icone}</span>
      <span className="cli-menu-texto">
        {titulo}
        <small>{descricao}</small>
      </span>
      {Boolean(contador) && <span className="cli-contador" aria-label={`${contador} novidades`}>{contador}</span>}
      <FiChevronRight className="cli-menu-seta" aria-hidden="true" />
    </button>
  )
}

export function ClienteInicio() {
  const navigate = useNavigate()
  const { perfil } = useCliente()

  const [avisos, setAvisos] = useState<Notificacao[]>([])

  useEffect(() => {
    clientePortalService.listarNotificacoes()
      .then(dados => setAvisos(dados.notificacoes.filter(n => !n.lida)))
      .catch(() => setAvisos([]))
  }, [])

  async function dispensarAvisos() {
    setAvisos([])
    await clientePortalService.marcarNotificacoesLidas().catch(() => undefined)
  }

  const primeiroNome = perfil.nome.split(' ')[0]

  return (
    <>
      <div className="cli-saudacao">
        <h2>Olá, {primeiroNome}!</h2>
        <p>O que você gostaria de fazer hoje?</p>
      </div>

      {avisos.length > 0 && (
        <section className="cli-avisos" aria-label="Avisos da clínica">
          {avisos.slice(0, 3).map(aviso => (
            <div
              key={aviso.id}
              className={`cli-aviso-item ${aviso.tipo === 'AGENDAMENTO_CANCELADO' ? 'cancelado' : 'confirmado'}`}
            >
              <FiBell aria-hidden="true" />
              <div>
                <strong>{aviso.titulo}</strong>
                <p>{aviso.mensagem}</p>
              </div>
            </div>
          ))}
          <button type="button" className="cli-link" onClick={dispensarAvisos}>
            Ok, entendi
          </button>
        </section>
      )}

      <div className="cli-menu">
        <ItemMenu
          icone={<FiCalendar />}
          titulo="Agendar horário"
          descricao="Escolha os serviços, o dia e o horário"
          onClick={() => navigate('/cliente/agendar')}
        />

        <ItemMenu
          icone={<FiList />}
          titulo="Meus agendamentos"
          descricao="Veja, remarque ou cancele"
          contador={avisos.length}
          onClick={() => navigate('/cliente/agendamentos')}
        />

        <ItemMenu
          icone={<FiUser />}
          titulo="Meu perfil"
          descricao="Seus dados e sua senha"
          onClick={() => navigate('/cliente/perfil')}
        />

        {perfil.clinicaTelefone && (
          <a
            className="cli-menu-item"
            href={linkWhatsApp(perfil.clinicaTelefone)}
            target="_blank"
            rel="noreferrer"
          >
            <span className="cli-menu-icone cli-menu-icone-whatsapp" aria-hidden="true">
              <FiMessageCircle />
            </span>
            <span className="cli-menu-texto">
              Fale conosco
              <small>Pelo WhatsApp</small>
            </span>
            <FiChevronRight className="cli-menu-seta" aria-hidden="true" />
          </a>
        )}
      </div>
    </>
  )
}
