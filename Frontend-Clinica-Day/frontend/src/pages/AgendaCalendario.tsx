import { useEffect, useState, useCallback } from 'react'
import { api } from '../services/api'
import '../styles/agenda.css'

/* =======================
   TIPOS
======================= */

type DiaAgendaBase = {
  diaSemana: number
  ativo: boolean
  horaInicio?: string
  horaFim?: string
}

type StatusAgendamento =
  | 'CRIADO'
  | 'CONFIRMADO'
  | 'CANCELADO'
  | 'FINALIZADO'
  | 'AGENDADO' // legado

type Agendamento = {
  Id: number
  HoraInicio: string
  HoraFim: string
  Servico: string
  Cliente: string
  Status: StatusAgendamento
}

type ExcecaoAgenda = {
  Id: number
  TipoExcecao: 'ABRIR' | 'FECHAR'
  HoraInicio: string
  HoraFim: string
  Observacao?: string
}

type SlotAgenda =
  | { hora: string; status: 'LIVRE' }
  | { hora: string; status: 'AGENDADO'; agendamento: Agendamento }
  | {
    hora: string
    status: 'EXCECAO'
    tipo: 'ABRIR' | 'FECHAR'
    observacao?: string
  }

type BlocoTimeline = {
  inicio: string
  fim: string

  tipo:
  | 'LIVRE'
  | 'AGENDADO'
  | 'EXCECAO'

  agendamento?: Agendamento

  observacao?: string

  tipoExcecao?: string
}

/* =======================
   TYPE GUARD
======================= */

function isSlotAgendado(
  s: SlotAgenda
): s is { hora: string; status: 'AGENDADO'; agendamento: Agendamento } {
  return s.status === 'AGENDADO'
}

/* =======================
   UTILITÁRIOS
======================= */

function gerarDiasDoMes(ano: number, mes: number): Date[] {
  const ultimoDia = new Date(ano, mes + 1, 0)
  return Array.from({ length: ultimoDia.getDate() }, (_, i) =>
    new Date(ano, mes, i + 1)
  )
}

function mesmaData(a: Date, b: Date) {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  )
}

function formatarDataLocal(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatarDataBR(data: string) {
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}


function horaParaMinutos(hora: string) {
  const [h, m] = hora.split(':').map(Number)
  return h * 60 + m
}

function minutosParaTexto(minutos: number) {

  const horas = Math.floor(minutos / 60)
  const mins = minutos % 60

  if (horas > 0 && mins > 0) {
    return `${horas}h ${mins}min`
  }

  if (horas > 0) {
    return `${horas}h`
  }

  return `${mins} min`
}


function normalizarStatus(status: StatusAgendamento): StatusAgendamento {
  return status === 'AGENDADO' ? 'CRIADO' : status
}

/* =======================
   CONTROLE DE REQUISIÇÕES
======================= */

let abortController: AbortController | null = null

/* =======================
   COMPONENTE
======================= */

export default function AgendaCalendario() {
  const hoje = new Date()

  const [ano, setAno] = useState(hoje.getFullYear())
  const [mes, setMes] = useState(hoje.getMonth())
  const [dataSelecionada, setDataSelecionada] = useState<Date>(hoje)

  const [agendaBase, setAgendaBase] = useState<DiaAgendaBase[]>([])
  const [slots, setSlots] = useState<SlotAgenda[]>([])
  const [mostrarLivres, setMostrarLivres] = useState(false)
  const [diaAberto, setDiaAberto] = useState<boolean | null>(null)
  const [loadingAgenda, setLoadingAgenda] = useState(false)
  const [diasComExcecao, setDiasComExcecao] = useState<string[]>([])
  const [excecoesDia, setExcecoesDia] = useState<ExcecaoAgenda[]>([])
  const [agendaFechada, setAgendaFechada] = useState(false)
  const [dataLimiteAgenda, setDataLimiteAgenda] = useState<string | null>(null)
  const [dataFechamentoAgenda, setDataFechamentoAgenda] = useState<string | null>(null)


  const diasMes = gerarDiasDoMes(ano, mes)
  const primeiroDiaSemana = new Date(ano, mes, 1).getDay()

  /* =======================
     AGENDA BASE
  ======================= */

  useEffect(() => {
    api.get('/agenda/base').then(resp => {
      setAgendaBase(resp.data?.agenda ?? [])
    })
  }, [])

  function obterAgendaBaseDia(date: Date) {
    return agendaBase.find(d => d.diaSemana === date.getDay())
  }

  /* =======================
     DIAS COM EXCEÇÃO
  ======================= */

  useEffect(() => {
    const mesAtual = `${ano}-${String(mes + 1).padStart(2, '0')}`

    api
      .get('/agenda/excecao/dias', { params: { mes: mesAtual } })
      .then(resp => {
        setDiasComExcecao(resp.data?.dias ?? [])
      })
  }, [ano, mes])

  /* =======================
     AGENDA DO DIA
  ======================= */

  const carregarAgendaDia = useCallback(async () => {
    if (abortController) abortController.abort()
    abortController = new AbortController()

    setLoadingAgenda(true)
    setSlots([])
    setDiaAberto(null)

    const data = formatarDataLocal(dataSelecionada)

    try {
      const dispResp = await api.get('/agenda/disponibilidade', {
        params: { data, servicoId: 1 },
        signal: abortController.signal
      })

      const horarios: string[] =
        dispResp.data?.horariosDisponiveis ?? []

      if (horarios.length === 0) {
        setDiaAberto(false)
        return
      }

      setDiaAberto(true)

      const agResp = await api.get('/agendamentos', {
        params: { data },
        signal: abortController.signal
      })

      const agendamentos: Agendamento[] =
        agResp.data?.agendamentos ?? []

      const excResp = await api.get('/agenda/excecao', {
        params: { data },
        signal: abortController.signal
      })

      const excecoes: ExcecaoAgenda[] =
        excResp.data?.excecoes ?? excResp.data ?? []
      setExcecoesDia(excecoes)

      setSlots(
        horarios.map(h => {
          const slotMin = horaParaMinutos(h)

          const excecaoFechar = excecoes.find(exc => {
            if (exc.TipoExcecao !== 'FECHAR') return false
            const ini = horaParaMinutos(exc.HoraInicio)
            const fim = horaParaMinutos(exc.HoraFim)
            return slotMin >= ini && slotMin < fim
          })

          if (excecaoFechar) {
            return {
              hora: h,
              status: 'EXCECAO',
              tipo: 'FECHAR',
              observacao: excecaoFechar.Observacao
            }
          }

          const ag = agendamentos.find(a => {
            const ini = horaParaMinutos(a.HoraInicio)
            const fim = horaParaMinutos(a.HoraFim)
            return slotMin >= ini && slotMin < fim
          })

          if (ag) {
            ag.Status = normalizarStatus(ag.Status)
            return { hora: h, status: 'AGENDADO', agendamento: ag }
          }

          return { hora: h, status: 'LIVRE' }
        })
      )
    } finally {
      setLoadingAgenda(false)
    }
  }, [dataSelecionada])

  useEffect(() => {
    carregarAgendaDia()
  }, [carregarAgendaDia])

  useEffect(() => {
    async function carregarConfigAgenda() {
      try {
        const resp = await api.get('/clinica/configuracoes')

        const dias = resp.data.DiasLiberacaoAgenda
        const data = resp.data.DataLimiteAgenda
        const dataFechamento = resp.data.DataFechamentoAgenda

        if (dataFechamento) {
          setDataFechamentoAgenda(dataFechamento.split('T')[0])
        }

        if (!dias && !data) {
          // totalmente fechada
          setAgendaFechada(true)
          setDataLimiteAgenda(null)
        } else {
          setAgendaFechada(false)

          if (data) {
            // ✅ PRIORIDADE: DATA ESPECÍFICA
            setDataLimiteAgenda(data.split('T')[0])
          } else if (dias) {
            // ✅ FALLBACK: DIAS
            const hoje = new Date()
            hoje.setDate(hoje.getDate() + dias)

            const limiteObj = new Date(hoje)
            limiteObj.setHours(23, 59, 59, 999)

            const limite = limiteObj.toISOString().split('T')[0]
            setDataLimiteAgenda(limite)
          }
        }
      } catch {
        console.warn('Erro config agenda')
      }
    }

    carregarConfigAgenda()
  }, [])


  /* =======================
     AÇÕES
  ======================= */

  async function confirmar(id: number) {
    await api.patch(`/agendamentos/${id}/confirmar`)
    carregarAgendaDia()
  }

  async function cancelar(id: number) {
    const fecharHorario = window.confirm(
      'Deseja FECHAR este horário após o cancelamento?\n\n' +
      'OK = fechar o horário\nCancelar = manter disponível'
    )

    await api.patch(`/agendamentos/${id}/cancelar`, {
      bloquearHorario: fecharHorario,
      origem: 'CLINICA'
    })

    // ✅ IMPORTANTE: aguardar atualização real
    await carregarAgendaDia()
  }



  async function finalizarDia() {
    const ids = slots
      .filter(isSlotAgendado)
      .filter(s => s.agendamento.Status === 'CONFIRMADO')
      .map(s => s.agendamento.Id)

    if (ids.length === 0) return

    await api.patch('/agendamentos/finalizar', { ids })
    carregarAgendaDia()
  }

  /* =======================
     NAVEGAÇÃO
  ======================= */

  function mesAnterior() {
    if (mes === 0) {
      setMes(11)
      setAno(a => a - 1)
    } else setMes(m => m - 1)
  }

  function mesSeguinte() {
    if (mes === 11) {
      setMes(0)
      setAno(a => a + 1)
    } else setMes(m => m + 1)
  }

  const nomeMes = new Date(ano, mes).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric'
  })

  const agendaDia = obterAgendaBaseDia(
    dataSelecionada
  )

  const horaInicioDia =
    agendaDia?.horaInicio?.substring(0, 5)
    || '08:00'

  const horaFimDia =
    agendaDia?.horaFim?.substring(0, 5)
    || '18:00'

  const timeline: BlocoTimeline[] = []

  const agendamentosUnicos = slots
    .filter(isSlotAgendado)
    .map(s => s.agendamento)
    .filter(
      (ag, index, array) =>
        array.findIndex(
          x => x.Id === ag.Id
        ) === index
    )


  agendamentosUnicos.forEach(ag => {

    timeline.push({
      inicio: ag.HoraInicio,
      fim: ag.HoraFim,
      tipo: 'AGENDADO',
      agendamento: ag
    })

  })

  excecoesDia.forEach(exc => {

    timeline.push({
      inicio: exc.HoraInicio,
      fim: exc.HoraFim,
      tipo: 'EXCECAO',
      observacao: exc.Observacao,
      tipoExcecao: exc.TipoExcecao
    })

  })


  timeline.sort(
    (a, b) =>
      horaParaMinutos(a.inicio) -
      horaParaMinutos(b.inicio)
  )

  const timelineFinal: BlocoTimeline[] = []

  let cursor = horaInicioDia

  timeline.forEach(bloco => {

    if (
      horaParaMinutos(bloco.inicio) >
      horaParaMinutos(cursor)
    ) {

      timelineFinal.push({
        inicio: cursor,
        fim: bloco.inicio,
        tipo: 'LIVRE'
      })

    }

    timelineFinal.push(bloco)

    if (
      horaParaMinutos(bloco.fim) >
      horaParaMinutos(cursor)
    ) {
      cursor = bloco.fim
    }

  })

  if (
    horaParaMinutos(cursor) <
    horaParaMinutos(horaFimDia)
  ) {

    timelineFinal.push({
      inicio: cursor,
      fim: horaFimDia,
      tipo: 'LIVRE'
    })

  }


  const timelineExibicao =
    mostrarLivres
      ? timelineFinal
      : timelineFinal.filter(
        item => item.tipo !== 'LIVRE'
      )

  const totalAgendamentos =
    timelineExibicao.filter(
      x => x.tipo === 'AGENDADO'
    ).length

  const totalExcecoes =
    timelineExibicao.filter(
      x => x.tipo === 'EXCECAO'
    ).length

  const minutosLivres =
    timelineExibicao
      .filter(x => x.tipo === 'LIVRE')
      .reduce((acc, item) => {

        return (
          acc +
          (
            horaParaMinutos(item.fim) -
            horaParaMinutos(item.inicio)
          )
        )

      }, 0)

  const cargaDia =
    horaParaMinutos(horaFimDia) -
    horaParaMinutos(horaInicioDia)

  const tituloDia =
    dataSelecionada.toLocaleDateString(
      'pt-BR',
      {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }
    )

  /* =======================
     RENDER
  ======================= */

  return (
    <div className="agenda-container">

      <h1>Agenda</h1>

      <p className="agenda-subtitulo">
        Gerencie os horários e atendimentos da clínica
      </p>


      <div className="agenda-page">

        {/* COLUNA ESQUERDA */}

        <div className="agenda-sidebar">

          {/* CALENDÁRIO */}

          <div className="agenda-calendario-card">

            <div className="agenda-header">
              <button onClick={mesAnterior}>◀</button>
              <h2>{nomeMes}</h2>
              <button onClick={mesSeguinte}>▶</button>
            </div>

            <div className="calendario-semana">
              <div>Dom</div>
              <div>Seg</div>
              <div>Ter</div>
              <div>Qua</div>
              <div>Qui</div>
              <div>Sex</div>
              <div>Sáb</div>
            </div>

            <div className="calendario-grid">

              {Array.from({ length: primeiroDiaSemana }).map((_, i) => (
                <div key={i} />
              ))}

              {diasMes.map(dia => {

                // const aberto =
                //   obterAgendaBaseDia(dia)?.ativo ?? false

                const dataStr =
                  formatarDataLocal(dia)

                // const temExcecao =
                //   diasComExcecao.includes(dataStr)

                const dataObj =
                  new Date(dataStr + 'T00:00:00')

                const fechamentoObj =
                  dataFechamentoAgenda
                    ? new Date(
                      dataFechamentoAgenda + 'T00:00:00'
                    )
                    : null

                const limiteObj =
                  dataLimiteAgenda
                    ? new Date(
                      dataLimiteAgenda + 'T00:00:00'
                    )
                    : null

                const bloqueado =
                  agendaFechada ||
                  (fechamentoObj &&
                    dataObj <= fechamentoObj) ||
                  (limiteObj &&
                    dataObj > limiteObj)

                // let cor =
                //   aberto
                //     ? '#d4edda'
                //     : '#f8d7da'

                // if (temExcecao) cor = '#fff3cd'
                // if (bloqueado) cor = '#d3d3d3'
                // if (mesmaData(dia, dataSelecionada))
                //   cor = '#cce5ff'

                return (
                  <button
                    key={dia.toISOString()}
                    onClick={() => {

                      if (bloqueado) return

                      setDataSelecionada(dia)

                    }}
                    className={
                      `
  ${bloqueado
                        ? 'calendario-dia calendario-dia-bloqueado'
                        : 'calendario-dia'}
  ${mesmaData(dia, dataSelecionada)
                        ? 'calendario-dia-selecionado'
                        : ''}
  `
                    }
                  // style={{
                  //   background: cor
                  // }}
                  >
                    {dia.getDate()}

                    {diasComExcecao.includes(dataStr) && (
                      <span className="dia-indicador" />
                    )}

                  </button>
                )

              })}

            </div>

          </div>

          {/* RESUMO */}

          <div className="agenda-resumo-card">

            <h3 className="agenda-titulo-dia">
              📅 {tituloDia}
            </h3>

            <div className="agenda-resumo-info">

              <div className="resumo-linha">
                <span>📅 Agendamentos</span>
                <strong>{totalAgendamentos}</strong>
              </div>

              <div className="resumo-linha">
                <span>🕒 Horas de agenda</span>
                <strong>{minutosParaTexto(cargaDia)}</strong>
              </div>

              <div className="resumo-linha">
                <span>🟢 Horários livres</span>
                <strong>{minutosParaTexto(minutosLivres)}</strong>
              </div>

              <div className="resumo-linha">
                <span>⛔ Exceções</span>
                <strong>{totalExcecoes}</strong>
              </div>

            </div>

            <div className="resumo-status">

              {agendaFechada
                ? '🔒 Agenda fechada'
                : dataFechamentoAgenda
                  ? `🔒 Fechada até ${formatarDataBR(dataFechamentoAgenda)}`
                  : dataLimiteAgenda
                    ? `✅ Agenda aberta até ${formatarDataBR(dataLimiteAgenda)}`
                    : ''}

            </div>

          </div>

        </div>

        {/* COLUNA DIREITA */}

        <div className="agenda-main">

          {loadingAgenda && <p>Carregando...</p>}

          {!loadingAgenda &&
            diaAberto === false && (
              <p>Clínica fechada</p>
            )}

          {!loadingAgenda &&
            diaAberto === true && (
              <>

                <div className="agenda-acoes-superiores">

                  <button
                    className="btn-finalizar-dia"
                    onClick={finalizarDia}
                  >
                    Finalizar Dia
                  </button>

                  <label className="check-livres">

                    <input
                      type="checkbox"
                      checked={mostrarLivres}
                      onChange={() =>
                        setMostrarLivres(!mostrarLivres)
                      }
                    />

                    Mostrar livres

                  </label>

                </div>


                <div className="agenda-scroll">

                  <div className="agenda-lista">

                    {timelineExibicao.map((item, index) => (

                      <div
                        key={index}
                        className={
                          item.tipo === 'AGENDADO'
                            ? 'agenda-card agenda-card-agendado'
                            : item.tipo === 'EXCECAO'
                              ? 'agenda-card agenda-card-excecao'
                              : 'agenda-card agenda-card-livre'
                        }
                      >

                        <div className="agenda-hora">
                          {item.inicio}
                          {' às '}
                          {item.fim}
                        </div>

                        {item.tipo === 'LIVRE' && (
                          <>
                            <div className="agenda-cliente">
                              🟢 Horário Disponível
                            </div>


                            <div className="agenda-servico">
                              Nenhum atendimento programado neste período
                            </div>
                          </>
                        )}

                        {item.tipo === 'AGENDADO' && (
                          <>
                            <div className="agenda-cliente">
                              👤 {item.agendamento?.Cliente}
                            </div>

                            <div className="agenda-servico">
                              🧴 {item.agendamento?.Servico}
                            </div>

                            <div
                              className={`agenda-status-badge ${item.agendamento?.Status === 'CONFIRMADO'
                                ? 'status-confirmado'
                                : item.agendamento?.Status === 'FINALIZADO'
                                  ? 'status-finalizado'
                                  : 'status-criado'
                                }`}
                            >
                              {item.agendamento?.Status === 'CRIADO'
                                ? 'AGUARDANDO CONFIRMAÇÃO'
                                : item.agendamento?.Status === 'CONFIRMADO'
                                  ? 'CONFIRMADO'
                                  : item.agendamento?.Status === 'FINALIZADO'
                                    ? 'FINALIZADO'
                                    : 'CANCELADO'}
                            </div>

                            <div className="agenda-acoes-card">

                              {item.agendamento?.Status === 'CRIADO' && (
                                <button
                                  className="btn-confirmar"
                                  onClick={() =>
                                    confirmar(item.agendamento!.Id)
                                  }
                                >
                                  Confirmar
                                </button>
                              )}

                              {['CRIADO', 'CONFIRMADO'].includes(
                                item.agendamento?.Status || ''
                              ) && (
                                  <button
                                    className="btn-cancelar"
                                    onClick={() =>
                                      cancelar(item.agendamento!.Id)
                                    }
                                  >
                                    Cancelar
                                  </button>
                                )}

                            </div>
                          </>
                        )}

                        {item.tipo === 'EXCECAO' && (
                          <>
                            <div className="agenda-cliente">

                              {item.observacao?.toLowerCase()
                                .includes('almoço') ||
                                item.observacao?.toLowerCase()
                                  .includes('almoco')
                                ? '🍽️'
                                : item.tipoExcecao === 'ABRIR'
                                  ? '✅'
                                  : '⛔'}

                              {' '}

                              {item.observacao || 'Horário bloqueado'}

                            </div>

                            <div className="agenda-servico">
                              {item.tipoExcecao === 'ABRIR'
                                ? 'Horário liberado excepcionalmente'
                                : 'Período indisponível'}
                            </div>
                          </>
                        )}


                        <div className="agenda-duracao">
                          {item.tipo === 'LIVRE'
                            ? `⏱ ${minutosParaTexto(
                              horaParaMinutos(item.fim) -
                              horaParaMinutos(item.inicio)
                            )} disponíveis`
                            : `⏱ ${minutosParaTexto(
                              horaParaMinutos(item.fim) -
                              horaParaMinutos(item.inicio)
                            )}`
                          }
                        </div>

                      </div>

                    ))}

                  </div>
                </div>

              </>
            )}

        </div>

      </div>

    </div>
  )
}