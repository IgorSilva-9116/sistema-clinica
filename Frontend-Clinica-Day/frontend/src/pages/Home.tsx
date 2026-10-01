import { useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'
import { agendamentoService } from '../services/agendamentoService'
import { clienteService } from '../services/clienteService'
import '../styles/home.css'
import { FiGift, FiUsers, FiAward, FiCalendar, FiClock, FiBell, FiHeart } from 'react-icons/fi'
import quoteImage from '../assets/images/quote-image.png'

export function Home() {

  const [agendamentosHoje, setAgendamentosHoje] = useState<any[]>([])
  const [aniversariantes, setAniversariantes] = useState<any[]>([])

  const [totalClientes, setTotalClientes] = useState(0)
  const [totalServicos, setTotalServicos] = useState(0)
  const [mostrarNotificacoes, setMostrarNotificacoes] = useState(false)

  // Notificações montadas a partir dos dados que a Home já carrega —
  // sem precisar de endpoint novo. No futuro, dá pra somar aqui
  // eventos vindos do backend (cancelamentos, confirmações pendentes etc.)
  const notificacoes = useMemo(() => {

    const lista: { id: string; texto: string }[] = []

    if (agendamentosHoje.length > 0) {
      lista.push({
        id: 'agendamentos-hoje',
        texto: `📅 Você tem ${agendamentosHoje.length} agendamento${
          agendamentosHoje.length > 1 ? 's' : ''
        } hoje.`
      })
    }

    if (aniversariantes.length > 0) {
      lista.push({
        id: 'aniversariantes',
        texto: `🎂 ${aniversariantes.length} cliente${
          aniversariantes.length > 1 ? 's fazem' : ' faz'
        } aniversário este mês.`
      })
    }

    return lista

  }, [agendamentosHoje, aniversariantes])

  useEffect(() => {
    carregarDashboard()
  }, [])

  async function carregarDashboard() {

    try {

      const hoje =
        new Date()
          .toISOString()
          .split('T')[0]

      const agendaResp =
        await agendamentoService.listar(hoje)

      setAgendamentosHoje(
        agendaResp.agendamentos || []
      )

      const aniversariantesResp =
        await clienteService.listarAniversariantes()

      setAniversariantes(
        aniversariantesResp.aniversariantes || []
      )

      const clientesResp =
        await api.get('/clientes')

      setTotalClientes(
        clientesResp.data.clientes?.length || 0
      )

      const servicosResp =
        await api.get('/servicos')

      setTotalServicos(
        servicosResp.data.servicos?.length || 0
      )

    } catch (err) {

      console.error(err)

    }

  }



  return (

    <div className="dashboard-container">

      <div className="dashboard-header">

        <div>

          <h1 className="dashboard-title">
            Visão Geral
          </h1>

          <p className="dashboard-subtitle">
            Bem-vinda ao painel de gestão da sua clínica
          </p>

        </div>

        <div className="dashboard-date">

          <div className="notif-bell-wrapper">

            <button
              className="notif-bell-button"
              onClick={() =>
                setMostrarNotificacoes((v) => !v)
              }
              aria-label="Notificações"
            >
              <FiBell />

              {notificacoes.length > 0 && (
                <span className="notif-badge">
                  {notificacoes.length}
                </span>
              )}
            </button>

            {mostrarNotificacoes && (

              <div className="notif-dropdown">

                <div className="notif-dropdown-header">
                  Notificações
                </div>

                {notificacoes.length === 0 ? (

                  <p className="notif-dropdown-empty">
                    Nenhuma notificação no momento.
                  </p>

                ) : (

                  notificacoes.map((n) => (

                    <div
                      key={n.id}
                      className="notif-dropdown-item"
                    >
                      {n.texto}
                    </div>

                  ))

                )}

              </div>

            )}

          </div>

          <div className="dashboard-date-box">

            <FiCalendar />

            <span className="date-full">
              {new Date().toLocaleDateString(
                'pt-BR',
                {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                }
              )}
            </span>

            <span className="date-short">
              {new Date().toLocaleDateString(
                'pt-BR',
                {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                }
              )}
            </span>

          </div>

        </div>

      </div>

      <div className="dashboard-cards">

        <div className="dashboard-card">

          <div className="card-icon">
            <FiCalendar />
          </div>

          <h3>
            Agendamentos Hoje
          </h3>

          <h2>
            {agendamentosHoje.length}
          </h2>

          <p className="card-description">
            Total de hoje
          </p>

        </div>

        <div className="dashboard-card">

          <div className="card-icon">
            <FiGift />
          </div>

          <h3>
            Aniversariantes
          </h3>

          <h2>
            {aniversariantes.length}
          </h2>

          <p className="card-description">
            Este mês
          </p>
        </div>

        <div className="dashboard-card">

          <div className="card-icon">
            <FiUsers />
          </div>

          <h3>
            Clientes Ativos
          </h3>

          <h2>
            {totalClientes}
          </h2>
          <p className="card-description">
            Clientes cadastrados
          </p>
        </div>

        <div className="dashboard-card">

          <div className="card-icon">
            <FiAward />
          </div>

          <h3>
            Serviços Ativos
          </h3>

          <h2>
            {totalServicos}
          </h2>
          <p className="card-description">
            Serviços disponíveis
          </p>
        </div>

      </div>
      <div className="dashboard-main-grid">

        <div className="dashboard-section">

          <div className="card-icon">
            <FiClock />
          </div>

          <h2>
            Próximos Atendimentos
          </h2>

          <table className="dashboard-table">

            <thead>
              <tr>
                <th>Hora</th>
                <th>Cliente</th>
                <th>Serviço</th>
              </tr>
            </thead>

            <tbody>

              {agendamentosHoje
                .slice(0, 5)
                .map(item => (

                  <tr key={item.id}>

                    <td>
                      {item.HoraInicio}
                    </td>

                    <td>
                      {item.Cliente}
                    </td>

                    <td>
                      {item.Servico}
                    </td>

                  </tr>

                ))}

              {agendamentosHoje.length === 0 && (

                <tr>

                  <td colSpan={3}>

                    Nenhum atendimento agendado
                    para hoje.

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

        <div className="dashboard-right-column">

          <div className="dashboard-section">

            <h2>
              <FiGift />
              Aniversariantes do Mês
            </h2>

            <div className="dashboard-list">

              {aniversariantes.length === 0 && (
                <p>
                  Nenhum aniversariante este mês
                </p>
              )}

              {aniversariantes.map(item => (

                <div
                  key={item.id}
                  className="dashboard-list-item"
                >

                  <strong>
                    {item.nome}
                  </strong>

                  <span>
                    {
                      new Date(
                        item.dataNascimento
                      ).toLocaleDateString('pt-BR')
                    }
                  </span>

                </div>

              ))}

            </div>

          </div>

          <div className="dashboard-quote-card">

            <div className="quote-image">
              <img src={quoteImage} alt="Quote" className="quote-bg" />
            </div>

            <div className="quote-content">

              <h2>
                Beleza é se sentir bem consigo mesma
                todos os dias.
              </h2>

              <div className="quote-heart">
                <FiHeart />
              </div>

            </div>

          </div>

        </div>

      </div>


    </div>

  )
}