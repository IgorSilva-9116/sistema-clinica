import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import {
  FiArrowLeft,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiInfo,
  FiMessageCircle,
  FiPlus
} from 'react-icons/fi'
import {
  clientePortalService,
  dataLocal,
  dataPorExtenso,
  formatarDuracao,
  formatarPreco,
  linkWhatsApp,
  type AgendamentoCriado,
  type ConfiguracaoAgenda,
  type DiaAgenda,
  type ServicoPublico
} from '../../services/clientePortalService'
import { useCliente } from './useCliente'

type Etapa = 'servico' | 'horario' | 'confirmar' | 'concluido'

const ROTULOS_ETAPAS = ['Serviços', 'Dia e horário', 'Confirmar']

function mensagemDoErro(error: unknown, padrao: string) {
  return axios.isAxiosError(error) && error.response?.data?.mensagem
    ? error.response.data.mensagem
    : padrao
}

// Separa os horários por período para ficar fácil de achar
function agruparPorPeriodo(horarios: string[]) {
  const grupos: { titulo: string; horarios: string[] }[] = [
    { titulo: 'Manhã', horarios: [] },
    { titulo: 'Tarde', horarios: [] },
    { titulo: 'Noite', horarios: [] }
  ]

  for (const h of horarios) {
    const hora = Number(h.slice(0, 2))
    grupos[hora < 12 ? 0 : hora < 18 ? 1 : 2].horarios.push(h)
  }

  return grupos.filter(g => g.horarios.length > 0)
}

const somarMinutos = (hora: string, minutos: number) => {
  const [h, m] = hora.split(':').map(Number)
  const total = h * 60 + m + minutos
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

// Horário de cada serviço quando feitos em sequência
function montarSequencia(servicos: ServicoPublico[], inicio: string) {
  let cursor = inicio
  return servicos.map(s => {
    const item = { servico: s, inicio: cursor, fim: somarMinutos(cursor, s.duracaoMinutos) }
    cursor = item.fim
    return item
  })
}

export function ClienteAgendar() {
  const navigate = useNavigate()
  const { perfil } = useCliente()

  // Remarcação: /cliente/agendar?remarcar=<id do atendimento>
  const [params] = useSearchParams()
  const remarcarId = Number(params.get('remarcar')) || undefined

  const [etapa, setEtapa] = useState<Etapa>('servico')
  const [config, setConfig] = useState<ConfiguracaoAgenda | null>(null)
  const [servicos, setServicos] = useState<ServicoPublico[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  // Serviços na ordem em que a cliente tocou
  const [escolhidos, setEscolhidos] = useState<ServicoPublico[]>([])
  const [dias, setDias] = useState<DiaAgenda[]>([])
  const [dia, setDia] = useState<string | null>(null)
  const [horarios, setHorarios] = useState<string[]>([])
  const [carregandoHorarios, setCarregandoHorarios] = useState(false)
  const [horario, setHorario] = useState<string | null>(null)

  const [enviando, setEnviando] = useState(false)
  const [agendamento, setAgendamento] = useState<AgendamentoCriado | null>(null)

  useEffect(() => {
    Promise.all([
      clientePortalService.obterConfiguracaoAgenda(),
      clientePortalService.obterClinica(perfil.clinicaSlug)
    ])
      .then(async ([configuracao, clinica]) => {
        setConfig(configuracao)
        setServicos(clinica.servicos)

        if (remarcarId) {
          // Mesmos serviços do atendimento original, direto para o calendário
          const { proximos } = await clientePortalService.listarAtendimentos()
          const atendimento = proximos.find(a => a.id === remarcarId)
          const servicosAtivos = (atendimento?.servicos || [])
            .filter(s => s.status !== 'CANCELADO')
            .map(s => clinica.servicos.find(c => c.id === s.servicoId))
            .filter((s): s is ServicoPublico => Boolean(s))

          if (!atendimento || !atendimento.podeRemarcar || servicosAtivos.length === 0) {
            setErro('Este horário não pode mais ser remarcado pelo app. Fale conosco.')
            return
          }

          setEscolhidos(servicosAtivos)
          await irParaHorarios(servicosAtivos)
        }
      })
      .catch(() => setErro('Não foi possível carregar a agenda. Tente novamente.'))
      .finally(() => setCarregando(false))
    // Carrega uma vez ao abrir a tela
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perfil.clinicaSlug, remarcarId])

  const maxServicos = config?.maxServicos ?? 5
  const ids = escolhidos.map(s => s.id)
  const duracaoTotal = escolhidos.reduce((total, s) => total + s.duracaoMinutos, 0)
  const valorTotal = escolhidos.reduce((total, s) => total + Number(s.preco), 0)

  function alternarServico(servico: ServicoPublico) {
    setErro(null)

    if (escolhidos.some(s => s.id === servico.id)) {
      setEscolhidos(escolhidos.filter(s => s.id !== servico.id))
      return
    }

    if (escolhidos.length >= maxServicos) {
      setErro(`Você pode escolher até ${maxServicos} serviços por atendimento.`)
      return
    }

    setEscolhidos([...escolhidos, servico])
  }

  async function irParaHorarios(lista: ServicoPublico[] = escolhidos) {
    const servicoIds = lista.map(s => s.id)
    setDia(null)
    setHorario(null)
    setHorarios([])
    setErro(null)
    setEtapa('horario')
    setCarregandoHorarios(true)

    try {
      const diasLivres = await clientePortalService.listarDias(servicoIds, remarcarId)
      setDias(diasLivres)

      const primeiroLivre = diasLivres.find(d => d.livres > 0)
      if (primeiroLivre) {
        await escolherDia(primeiroLivre.data, servicoIds)
      }
    } catch (error) {
      setErro(mensagemDoErro(error, 'Não foi possível carregar os dias'))
    } finally {
      setCarregandoHorarios(false)
    }
  }

  async function escolherDia(data: string, servicoIds: number[] = ids) {
    setDia(data)
    setHorario(null)
    setCarregandoHorarios(true)

    try {
      setHorarios(await clientePortalService.listarHorarios(servicoIds, data, remarcarId))
    } catch (error) {
      setErro(mensagemDoErro(error, 'Não foi possível carregar os horários'))
    } finally {
      setCarregandoHorarios(false)
    }
  }

  async function confirmar() {
    if (escolhidos.length === 0 || !dia || !horario) return

    setEnviando(true)
    setErro(null)

    try {
      if (remarcarId) {
        const remarcado = await clientePortalService.remarcarAtendimento(remarcarId, { data: dia, horaInicio: horario })
        setAgendamento({
          ...remarcado,
          grupo: null,
          status: 'CRIADO',
          valorTotal,
          servicos: remarcado.servicos.map((s, i) => ({ ...s, valor: Number(escolhidos[i]?.preco || 0) }))
        })
      } else {
        setAgendamento(await clientePortalService.agendar({ servicoIds: ids, data: dia, horaInicio: horario }))
      }
      setEtapa('concluido')
    } catch (error) {
      setErro(mensagemDoErro(error, 'Não foi possível agendar. Tente novamente.'))

      // Alguém pegou o horário antes: volta para escolher outro, com a lista atualizada
      if (axios.isAxiosError(error) && error.response?.data?.codigo === 'HORARIO_INDISPONIVEL') {
        setEtapa('horario')
        await escolherDia(dia)
      }
    } finally {
      setEnviando(false)
    }
  }

  const indiceEtapa = etapa === 'servico' ? 0 : etapa === 'horario' ? 1 : 2
  const resumoEscolha = `${escolhidos.length} ${escolhidos.length === 1 ? 'serviço' : 'serviços'} · ${formatarDuracao(duracaoTotal)} · ${formatarPreco(valorTotal)}`

  if (carregando) {
    return <div className="cli-card"><p className="cli-carregando">Carregando a agenda…</p></div>
  }

  // ---------- Concluído ----------
  if (etapa === 'concluido' && agendamento) {
    return (
      <div className="cli-card cli-sucesso">
        <FiCheckCircle className="cli-sucesso-icone" aria-hidden="true" />
        <h2>{remarcarId ? 'Horário remarcado!' : 'Pedido enviado!'}</h2>
        <p className="cli-card-sub">
          Seu horário está reservado. A clínica vai confirmar em breve.
        </p>

        <div className="cli-resumo">
          <div><span>Dia</span><strong>{dataPorExtenso(agendamento.data)}</strong></div>
          {agendamento.servicos.map(s => (
            <div key={s.titulo + s.horaInicio}>
              <span>{s.horaInicio} às {s.horaFim}</span>
              <strong>{s.titulo}</strong>
            </div>
          ))}
          <div><span>Total</span><strong>{formatarPreco(agendamento.valorTotal)}</strong></div>
        </div>

        <button type="button" className="cli-btn cli-btn-primario" onClick={() => navigate('/cliente')}>
          Voltar ao início
        </button>
      </div>
    )
  }

  // ---------- Agenda ainda não liberada ----------
  if (config && !config.agendaLiberada) {
    return (
      <>
        <Link to="/cliente" className="cli-link cli-voltar">
          <FiArrowLeft aria-hidden="true" /> Voltar
        </Link>
        <div className="cli-card">
          <h2>Agenda em atualização</h2>
          <p className="cli-card-sub">
            No momento a agenda não está aberta para novos horários pelo app.
            Fale conosco que a gente encontra um horário para você.
          </p>
          {perfil.clinicaTelefone && (
            <a
              className="cli-btn cli-btn-whatsapp"
              href={linkWhatsApp(perfil.clinicaTelefone, 'Olá! Gostaria de agendar um horário.')}
              target="_blank"
              rel="noreferrer"
            >
              <FiMessageCircle aria-hidden="true" /> Fale conosco
            </a>
          )}
        </div>
      </>
    )
  }

  return (
    <>
      <button
        type="button"
        className="cli-link cli-voltar"
        onClick={() => {
          setErro(null)
          if (etapa === 'servico') navigate('/cliente')
          else if (etapa === 'horario' && remarcarId) navigate('/cliente/agendamentos')
          else setEtapa(etapa === 'confirmar' ? 'horario' : 'servico')
        }}
      >
        <FiArrowLeft aria-hidden="true" /> Voltar
      </button>

      <ol className="cli-etapas" aria-label="Etapas do agendamento">
        {ROTULOS_ETAPAS.map((rotulo, i) => (
          <li
            key={rotulo}
            className={i < indiceEtapa ? 'feita' : i === indiceEtapa ? 'atual' : ''}
            aria-current={i === indiceEtapa ? 'step' : undefined}
          >
            <span className="cli-etapa-numero">{i < indiceEtapa ? <FiCheck aria-hidden="true" /> : i + 1}</span>
            <span className="cli-etapa-rotulo">{rotulo}</span>
          </li>
        ))}
      </ol>

      {erro && <div className="cli-alerta cli-alerta-erro">{erro}</div>}

      {/* ---------- 1. Serviços ---------- */}
      {etapa === 'servico' && (
        <section className="cli-card">
          <h2>Quais serviços?</h2>
          <p className="cli-card-sub">
            Toque para escolher. Pode marcar mais de um para fazer no mesmo dia.
          </p>

          {servicos.map(s => {
            const ordem = escolhidos.findIndex(e => e.id === s.id)
            const marcado = ordem >= 0
            return (
              <button
                type="button"
                key={s.id}
                className={`cli-servico cli-servico-opcao ${marcado ? 'marcado' : ''}`}
                aria-pressed={marcado}
                onClick={() => alternarServico(s)}
              >
                <div className="cli-servico-icone" aria-hidden="true">
                  {marcado ? <FiCheck /> : <FiPlus />}
                </div>
                <div className="cli-servico-info">
                  <div className="cli-servico-nome">{s.titulo}</div>
                  <div className="cli-servico-detalhe">
                    <FiClock aria-hidden="true" /> {formatarDuracao(s.duracaoMinutos)}
                    {s.descricao && <span>· {s.descricao}</span>}
                  </div>
                </div>
                <div className="cli-servico-preco">{formatarPreco(s.preco)}</div>
              </button>
            )
          })}

          {escolhidos.length > 0 && (
            <div className="cli-barra-continuar">
              <div className="cli-barra-resumo">{resumoEscolha}</div>
              <button type="button" className="cli-btn cli-btn-primario" onClick={() => irParaHorarios()}>
                Ver horários
              </button>
            </div>
          )}
        </section>
      )}

      {/* ---------- 2. Dia e horário ---------- */}
      {etapa === 'horario' && escolhidos.length > 0 && (
        <section className="cli-card">
          <h2>{remarcarId ? 'Novo dia e horário' : 'Qual dia?'}</h2>
          <p className="cli-card-sub">
            {escolhidos.map(s => s.titulo).join(' + ')} · {formatarDuracao(duracaoTotal)}
          </p>

          {dias.length > 0 && (
            <div className="cli-dias" role="listbox" aria-label="Dias disponíveis">
              {dias.map(d => {
                const data = dataLocal(d.data)
                return (
                  <button
                    type="button"
                    key={d.data}
                    role="option"
                    aria-selected={dia === d.data}
                    className={`cli-dia ${dia === d.data ? 'selecionado' : ''}`}
                    disabled={d.livres === 0}
                    onClick={() => escolherDia(d.data)}
                  >
                    <span className="cli-dia-semana">
                      {data.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                    </span>
                    <span className="cli-dia-numero">{data.getDate()}</span>
                    <span className="cli-dia-mes">
                      {data.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {!carregandoHorarios && dias.length > 0 && dias.every(d => d.livres === 0) && (
            <div className="cli-alerta cli-alerta-info">
              {escolhidos.length > 1
                ? 'Não há um horário em que todos esses serviços caibam juntos nas próximas semanas. Tente com menos serviços ou fale conosco.'
                : 'Não há horários livres para este serviço nas próximas semanas. Fale conosco.'}
            </div>
          )}

          {dia && (
            <>
              <h3 className="cli-subtitulo">
                <FiCalendar aria-hidden="true" /> {dataPorExtenso(dia)}
              </h3>

              {carregandoHorarios && <p className="cli-carregando">Buscando horários…</p>}

              {!carregandoHorarios && horarios.length === 0 && (
                <p className="cli-texto-suave">Sem horários livres neste dia. Escolha outro dia.</p>
              )}

              {!carregandoHorarios && agruparPorPeriodo(horarios).map(grupo => (
                <div key={grupo.titulo}>
                  <p className="cli-periodo">{grupo.titulo}</p>
                  <div className="cli-horarios">
                    {grupo.horarios.map(h => (
                      <button
                        type="button"
                        key={h}
                        className={`cli-horario ${horario === h ? 'selecionado' : ''}`}
                        aria-pressed={horario === h}
                        onClick={() => setHorario(h)}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}

          <button
            type="button"
            className="cli-btn cli-btn-primario cli-btn-continuar"
            disabled={!horario}
            onClick={() => setEtapa('confirmar')}
          >
            {horario
              ? `Continuar · ${horario} às ${somarMinutos(horario, duracaoTotal)}`
              : 'Escolha um horário'}
          </button>
        </section>
      )}

      {/* ---------- 3. Confirmar ---------- */}
      {etapa === 'confirmar' && escolhidos.length > 0 && dia && horario && (
        <section className="cli-card">
          <h2>{remarcarId ? 'Confirme o novo horário' : 'Confirme seu horário'}</h2>
          <p className="cli-card-sub">Confira os dados antes de enviar</p>

          <div className="cli-resumo">
            <div><span>Dia</span><strong>{dataPorExtenso(dia)}</strong></div>
            {montarSequencia(escolhidos, horario).map(item => (
              <div key={item.servico.id}>
                <span>{item.inicio} às {item.fim}</span>
                <strong>{item.servico.titulo}</strong>
              </div>
            ))}
            <div><span>Total</span><strong>{formatarPreco(valorTotal)}</strong></div>
          </div>

          <div className="cli-aviso">
            <FiInfo aria-hidden="true" />
            <div>
              <p>Seu horário fica reservado e a clínica confirma em breve.</p>
              {config && config.janelaCancelamentoHoras > 0 && config.multaPercentual > 0 && (
                <p>
                  Cancelamentos com menos de {config.janelaCancelamentoHoras}h de antecedência
                  têm multa de {config.multaPercentual}% do valor.
                </p>
              )}
              {config?.politicaAgendamento && (
                <p className="cli-politica">{config.politicaAgendamento}</p>
              )}
            </div>
          </div>

          <button type="button" className="cli-btn cli-btn-primario" disabled={enviando} onClick={confirmar}>
            {enviando ? 'Enviando…' : remarcarId ? 'Confirmar remarcação' : 'Confirmar agendamento'}
          </button>
        </section>
      )}
    </>
  )
}
