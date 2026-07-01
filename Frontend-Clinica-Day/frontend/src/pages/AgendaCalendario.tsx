import { useEffect, useState, useCallback } from 'react'
import { api } from '../services/api'

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
  const [diaAberto, setDiaAberto] = useState<boolean | null>(null)
  const [loadingAgenda, setLoadingAgenda] = useState(false)
  const [diasComExcecao, setDiasComExcecao] = useState<string[]>([])
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

  /* =======================
     RENDER
  ======================= */

  return (
    <div style={{ maxWidth: 700 }}>
      <h1>Agenda</h1>

    <p style={{ marginTop: 10, fontWeight: 'bold' }}>
      {agendaFechada
      ? '🔒 Agenda fechada'
      : dataFechamentoAgenda
      ? `🔒 Fechada até ${formatarDataBR(dataFechamentoAgenda)}`
      : dataLimiteAgenda
      ? `✅ Aberta até ${formatarDataBR(dataLimiteAgenda)}`
      : ''}
    </p>


      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={mesAnterior}>◀</button>
        <h2>{nomeMes}</h2>
        <button onClick={mesSeguinte}>▶</button>
      </div>

      {/* ✅ DIAS DA SEMANA */}
<div
  style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    textAlign: 'center',
    fontWeight: 'bold',
    marginTop: 20
  }}
>
  <div>Dom</div>
  <div>Seg</div>
  <div>Ter</div>
  <div>Qua</div>
  <div>Qui</div>
  <div>Sex</div>
  <div>Sáb</div>
</div>

<div
  style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 6,
    marginTop: 5
  }}
>
  {Array.from({ length: primeiroDiaSemana }).map((_, i) => (
    <div key={i} />
  ))}

  {diasMes.map(dia => {
    const aberto = obterAgendaBaseDia(dia)?.ativo ?? false
    const dataStr = formatarDataLocal(dia)
    const temExcecao = diasComExcecao.includes(dataStr)

  const dataObj = new Date(dataStr + 'T00:00:00')

  const fechamentoObj = dataFechamentoAgenda
    ? new Date(dataFechamentoAgenda + 'T00:00:00')
    : null

  const limiteObj = dataLimiteAgenda
    ? new Date(dataLimiteAgenda + 'T00:00:00')
    : null

  const bloqueado =
    agendaFechada ||
    (fechamentoObj && dataObj <= fechamentoObj) ||
    (limiteObj && dataObj > limiteObj)


    let cor = aberto ? '#d4edda' : '#f8d7da'
    if (temExcecao) cor = '#fff3cd'
    if (bloqueado) cor = '#d3d3d3'
    if (mesmaData(dia, dataSelecionada)) cor = '#cce5ff'
    
    return (
      <button
        key={dia.toISOString()}
        onClick={() => {
          if (bloqueado) return
          setDataSelecionada(dia)
        }}
        style={{
          padding: 8,
          border: '1px solid #999',
          background: cor,
          position: 'relative',
          cursor: bloqueado ? 'not-allowed' : 'pointer'
        }}
      >
        {dia.getDate()}

        {bloqueado && (
          <span style={{ fontSize: 10, marginLeft: 4 }}>
            🔒
          </span>
        )}
      </button>
    )
  })}
</div>

      <h3 style={{ marginTop: 30 }}>Agenda do Dia</h3>

      {loadingAgenda && <p>Carregando...</p>}
      {!loadingAgenda && diaAberto === false && <p>Clínica fechada</p>}

      {!loadingAgenda && diaAberto === true && (
        <>
          <button onClick={finalizarDia}>
            Finalizar atendimentos do dia
          </button>

          <ul>
            {slots.map(s => (
              <li key={s.hora}>
                <strong>{s.hora}</strong> — {s.status}

                {isSlotAgendado(s) && (
                  <div>
                    {s.agendamento.Servico} — {s.agendamento.Cliente}
                    <br />
                    Status: {s.agendamento.Status}

                    {s.agendamento.Status === 'CRIADO' && (
                      <button onClick={() => confirmar(s.agendamento.Id)}>
                        Confirmar
                      </button>
                    )}

                    {['CRIADO', 'CONFIRMADO'].includes(
                      s.agendamento.Status
                    ) && (
                      <button onClick={() => cancelar(s.agendamento.Id)}>
                        Cancelar
                      </button>
                    )}
                  </div>
                )}

                {s.status === 'EXCECAO' && (
                  <div style={{ color: '#856404' }}>
                    ⛔ {s.observacao}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}