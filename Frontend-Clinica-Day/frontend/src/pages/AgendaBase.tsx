import { useEffect, useState, useCallback } from 'react'
import { api } from '../services/api'
import '../styles/configurarAgenda.css'

type DiaAgendaBase = {
  id: number
  diaSemana: number
  horaInicio: string
  horaFim: string
  ativo: boolean
}

type EdicaoDia = {
  inicio: string
  fim: string
  alterado: boolean
}

const diasSemana = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado'
]

export default function AgendaBase() {
  const [agendaBase, setAgendaBase] = useState<DiaAgendaBase[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [edicao, setEdicao] = useState<Record<number, EdicaoDia>>({})

  // ✅ NOVOS STATES
  const [diasLiberacao, setDiasLiberacao] = useState(0)
  const [dataLimite, setDataLimite] = useState<string | null>(null)
  const [salvandoConfig, setSalvandoConfig] = useState(false)
  const [dataFechamento, setDataFechamento] = useState<string | null>(null)

  const horariosDisponiveis = Array.from(
    { length: 96 },
    (_, i) => {

      const hora = Math.floor(i / 4)
        .toString()
        .padStart(2, '0')

      const minuto = ((i % 4) * 15)
        .toString()
        .padStart(2, '0')

      return `${hora}:${minuto}`

    }
  )

  const carregarAgendaBase = useCallback(async () => {
    setLoading(true)
    setErro(null)
    setMensagem(null)

    try {
      const resp = await api.get('/agenda/base')
      const dados: DiaAgendaBase[] = resp.data?.agenda ?? []
      setAgendaBase(dados)

      const estado: Record<number, EdicaoDia> = {}
      dados.forEach(d => {
        estado[d.id] = {
          inicio: d.horaInicio,
          fim: d.horaFim,
          alterado: false
        }
      })
      setEdicao(estado)
    } catch {
      setErro('Não foi possível carregar a agenda base.')
    } finally {
      setLoading(false)
    }
  }, [])

  // ✅ NOVO
  async function carregarConfiguracao() {
    try {
      const resp = await api.get('/clinica/configuracoes')
      setDiasLiberacao(resp.data?.DiasLiberacaoAgenda || 0)
      const data = resp.data?.DataLimiteAgenda
      if (data) {
        setDataLimite(data.split('T')[0])
      } else {
        setDataLimite(null)
      }

    } catch {
      console.warn('Erro ao carregar configuração')
    }
  }

  // ✅ NOVO
  async function salvarConfiguracao() {
    try {
      setSalvandoConfig(true)

      await api.put('/clinica/configuracoes', {
        DiasLiberacaoAgenda: diasLiberacao,
        DataLimiteAgenda: dataLimite,
        DataFechamentoAgenda: null // ✅ limpa bloqueio ao reabrir
      })

      setMensagem('✅ Liberação da agenda atualizada com sucesso.')

    } catch {
      alert('Erro ao salvar configuração')
    } finally {
      setSalvandoConfig(false)
    }
  }

  async function ativarDia(id: number, nomeDia: string) {
    try {
      await api.patch(`/agenda/base/${id}/ativar-dia`)
      setMensagem(`✅ A clínica agora funciona na ${nomeDia}.`)
      carregarAgendaBase()
    } catch {
      alert('Erro ao ativar o dia.')
    }
  }

  function formatarDataBR(data: string) {
    const [ano, mes, dia] = data.split('-')
    return `${dia}/${mes}/${ano}`
  }

  function alterarHorario(
    id: number,
    campo: 'inicio' | 'fim',
    valor: string
  ) {
    setEdicao(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [campo]: valor,
        alterado: true
      }
    }))
  }

  async function salvarHorario(id: number, nomeDia: string) {
    const horario = edicao[id]

    try {
      await api.put(`/agenda/base/${id}`, {
        horaInicio: horario.inicio,
        horaFim: horario.fim
      })
      setMensagem(`✅ Horário da ${nomeDia} salvo com sucesso.`)
      carregarAgendaBase()
    } catch {
      alert('Erro ao salvar horário.')
    }
  }

  useEffect(() => {
    carregarAgendaBase()
    carregarConfiguracao()
  }, [])


  return (
    <div className="config-agenda-container">
      <h1>Configurar Agenda</h1>

      <p className="config-agenda-subtitulo">
        Configure os horários de funcionamento
        e a disponibilidade da agenda.
      </p>

      {/* ✅ 🔥 NOVA SEÇÃO */}
      <div className="config-card">
        <h3>Liberação da Agenda</h3>

        <h3>Status da Agenda</h3>

        <p>
          {dataLimite
            ? `✅ Aberta até ${dataLimite}`
            : diasLiberacao > 0
              ? `✅ Aberta por ${diasLiberacao} dias`
              : '🔒 Agenda fechada'}
        </p>

        <p>🔒 Fechar agenda até uma data:</p>

        <input
          type="date"
          value={dataFechamento || ''}
          onChange={(e) => setDataFechamento(e.target.value)}
        />

        <button
          className="btn-config"
          style={{ marginTop: 8 }}
          onClick={async () => {
            if (!dataFechamento) return;

            await api.put('/clinica/configuracoes', {
              DiasLiberacaoAgenda: diasLiberacao,
              DataLimiteAgenda: dataLimite,
              DataFechamentoAgenda: dataFechamento
            });

            setMensagem(`🔒 Agenda bloqueada até ${formatarDataBR(dataFechamento)}`)
          }}
        >
          Bloquear agenda
        </button>
        <hr />

        <p>📅 Abrir agenda para os próximos dias:</p>

        <select
          value={diasLiberacao}
          onChange={(e) => {
            setDiasLiberacao(Number(e.target.value))
            setDataLimite(null)
          }}
        >
          <option value={0}>Selecione</option>
          <option value={7}>1 semana</option>
          <option value={14}>2 semanas</option>
          <option value={30}>1 mês</option>
        </select>

        <hr />

        <p>📆 Ou abrir até uma data específica:</p>

        <input
          type="date"
          value={dataLimite || ''}
          onChange={(e) => {
            setDataLimite(e.target.value)
            setDiasLiberacao(0)
          }}
        />


        <div style={{ marginTop: 10 }}>
          <button className="btn-config" onClick={salvarConfiguracao} disabled={salvandoConfig} >
            {salvandoConfig ? 'Salvando...' : 'Salvar configuração'}
          </button>
        </div>

        {diasLiberacao === 0 && (
          <p style={{ color: 'red', marginTop: 10 }}>
            ⚠️ Agenda está fechada no momento.
          </p>
        )}
      </div>

      <h2 className="config-secao">
        Horários Semanais
      </h2>

      <p className="config-secao-texto">
        Defina os dias e horários em que a clínica normalmente funciona.
      </p>

      <p style={{ color: '#555' }}>
        Para feriados ou ajustes pontuais, utilize Exceções de Agenda.
      </p>

      {loading && <p>Carregando...</p>}
      {erro && (<div className="config-erro">⚠️ {erro} </div>)}
      {mensagem && (<div className="config-sucesso"> {mensagem} </div>)}

      <div className="dias-semana-grid">

        {!loading &&
          agendaBase.map(dia => {
            const ed = edicao[dia.id]
            const nomeDia = diasSemana[dia.diaSemana].toLowerCase()

            return (
              <div key={dia.id} className="dia-semana-card" >
                <h3>{diasSemana[dia.diaSemana]}</h3>

                {!dia.ativo && (
                  <>
                    <div className="status-dia-fechado">
                      FECHADO
                    </div>
                    <button className="btn-config" onClick={() => ativarDia(dia.id, nomeDia)}>
                      Definir funcionamento
                    </button>
                  </>
                )}

                {dia.ativo && ed && (
                  <>
                    <div className="status-dia-aberto">
                      FUNCIONANDO
                    </div>

                    <div className="linha-horarios">

                      <div className="campo-horario">

                        <label>Início</label>

                        <select
                          value={ed.inicio}
                          onChange={e =>
                            alterarHorario(
                              dia.id,
                              'inicio',
                              e.target.value
                            )
                          }
                        >

                          {horariosDisponiveis.map(h => (
                            <option
                              key={h}
                              value={h}
                            >
                              {h}
                            </option>
                          ))}

                        </select>

                      </div>

                      <br />

                      <div className="campo-horario">

                        <label>Fim</label>

                        <select
                          value={ed.fim}
                          onChange={e =>
                            alterarHorario(
                              dia.id,
                              'fim',
                              e.target.value
                            )
                          }
                        >

                          {horariosDisponiveis.map(h => (
                            <option
                              key={h}
                              value={h}
                            >
                              {h}
                            </option>
                          ))}

                        </select>

                      </div>
                    </div>

                    {ed.alterado && (
                      <div className="aviso-alteracao">
                        ⚠️ Clique em salvar para confirmar a alteração.
                      </div>
                    )}

                    <button
                      className="btn-config"
                      disabled={!ed.alterado}
                      onClick={() => salvarHorario(dia.id, nomeDia)}
                    >
                      Salvar horário
                    </button>
                  </>
                )}

              </div>
            )
          })}
      </div>
    </div>
  )
}