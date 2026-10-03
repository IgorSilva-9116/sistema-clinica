import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiCalendar, FiChevronRight, FiList, FiMessageCircle, FiUser } from 'react-icons/fi'
import { linkWhatsApp } from '../../services/clientePortalService'
import { useCliente } from './useCliente'

interface ItemMenuProps {
  icone: ReactNode
  titulo: string
  descricao: string
  emBreve?: boolean
  onClick?: () => void
}

function ItemMenu({ icone, titulo, descricao, emBreve, onClick }: ItemMenuProps) {
  return (
    <button type="button" className="cli-menu-item" disabled={emBreve} onClick={onClick}>
      <span className="cli-menu-icone" aria-hidden="true">{icone}</span>
      <span className="cli-menu-texto">
        {titulo}
        <small>{descricao}</small>
        {emBreve && <span className="cli-etiqueta">Em breve</span>}
      </span>
      {!emBreve && <FiChevronRight className="cli-menu-seta" aria-hidden="true" />}
    </button>
  )
}

export function ClienteInicio() {
  const navigate = useNavigate()
  const { perfil } = useCliente()

  const primeiroNome = perfil.nome.split(' ')[0]

  return (
    <>
      <div className="cli-saudacao">
        <h2>Olá, {primeiroNome}!</h2>
        <p>O que você gostaria de fazer hoje?</p>
      </div>

      <div className="cli-menu">
        <ItemMenu
          icone={<FiCalendar />}
          titulo="Agendar horário"
          descricao="Escolha o serviço, o dia e o horário"
          emBreve
        />

        <ItemMenu
          icone={<FiList />}
          titulo="Meus agendamentos"
          descricao="Veja, remarque ou cancele"
          emBreve
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
