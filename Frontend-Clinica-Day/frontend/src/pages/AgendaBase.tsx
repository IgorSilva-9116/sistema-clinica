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

function nomeDiaSemana(dia: number) {
  return diasSemana[dia] || 'Não informado'
}

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
  const [regraSabadoId, setRegraSabadoId] = useState<number | null>(null)
  const [sabadoAtivo, setSabadoAtivo] = useState(false)
  const [intervalos, setIntervalos] = useState<any[]>([])
  const [intervaloEditandoId, setIntervaloEditandoId] = useState<number | null>(null)
  const [descricaoIntervalo, setDescricaoIntervalo] = useState('')
  const [diaSemanaIntervalo, setDiaSemanaIntervalo] = useState(1)
  const [horaInicioIntervalo, setHoraInicioIntervalo] = useState('12:00')
  const [horaFimIntervalo, setHoraFimIntervalo] = useState('13:00')
  const [dataInicioIntervalo, setDataInicioIntervalo] = useState('')
  const [dataFimIntervalo, setDataFimIntervalo] = useState('')
  const [dataInicioSabado, setDataInicioSabado] = useState('')
  const [horaInicioSabado, setHoraInicioSabado] = useState('09:00')
  const [horaFimSabado, setHoraFimSabado] = useState('14:00')
  const [abaAtiva, setAbaAtiva] = useState('liberacao')

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

  useEffect(() => {

    if (!mensagem) return

    const timer = setTimeout(() => {

      setMensagem(null)

    }, 5000)

    return () => clearTimeout(timer)

  }, [mensagem])

  async function carregarRegraSabado() {

    try {

      const resp =
        await api.get(
          '/agenda/regra-recorrente'
        )

      const regra = resp.data?.regra

      if (!regra) return

      setRegraSabadoId(regra.Id)

      setSabadoAtivo(true)

      setDataInicioSabado(
        regra.DataInicio?.split('T')[0]
      )

      setHoraInicioSabado(
        regra.HoraInicio.substring(11, 16)
      )

      setHoraFimSabado(
        regra.HoraFim.substring(11, 16)
      )

    } catch {

      console.warn(
        'Erro ao carregar regra recorrente'
      )

    }
  }

  async function salvarRegraSabado() {

    setErro(null)
    setMensagem(null)

    if (horaInicioSabado >= horaFimSabado) {

      setErro(
        'A hora final deve ser maior que a hora inicial.'
      )

      return

    }

    try {


      if (regraSabadoId) {

        await api.put(
          `/agenda/regra-recorrente/${regraSabadoId}`,
          {
            dataInicio: dataInicioSabado,
            horaInicio: horaInicioSabado,
            horaFim: horaFimSabado
          }
        )

        setMensagem(
          '✅ Regra atualizada com sucesso.'
        )

      }
      else {

        await api.post(
          '/agenda/regra-recorrente',
          {
            tipoRegra: 'SABADO_ALTERNADO',
            dataInicio: dataInicioSabado,
            horaInicio: horaInicioSabado,
            horaFim: horaFimSabado
          }
        )

        setMensagem(
          '✅ Regra criada com sucesso.'
        )

      }

      await carregarRegraSabado()

    }

    catch (err: any) {

      console.error(err)

      setErro(
        err.response?.data?.mensagem ||
        '❌ Erro ao salvar regra.'
      )

    }
  }
  async function desativarRegraSabado() {

    if (!regraSabadoId) return

    try {

      await api.patch(
        `/agenda/regra-recorrente/${regraSabadoId}/desativar`
      )

      setRegraSabadoId(null)

      setSabadoAtivo(false)

      setDataInicioSabado('')

      setHoraInicioSabado('09:00')

      setHoraFimSabado('14:00')

      setMensagem(
        '✅ Regra de sábados alternados desativada.'
      )

    } catch {

      setErro(
        'Erro ao desativar regra.'
      )

    }

  }

  async function carregarIntervalos() {

    try {

      const resp =
        await api.get(
          '/agenda/intervalo-recorrente'
        )

      setIntervalos(
        resp.data?.intervalos ?? []
      )

    } catch {

      console.warn(
        'Erro ao carregar intervalos'
      )

    }

  }

  async function salvarIntervalo() {

    try {

      setErro(null)

      if (!descricaoIntervalo.trim()) {

        setErro(
          'Informe uma descrição para o intervalo.'
        )

        return
      }

      if (
        horaInicioIntervalo >=
        horaFimIntervalo
      ) {

        setErro(
          'A hora final deve ser maior que a hora inicial.'
        )

        return
      }

      if (intervaloEditandoId) {

        await api.put(
          `/agenda/intervalo-recorrente/${intervaloEditandoId}`,
          {
            diaSemana: diaSemanaIntervalo,
            horaInicio: horaInicioIntervalo,
            horaFim: horaFimIntervalo,
            descricao: descricaoIntervalo,
            dataInicio:
              dataInicioIntervalo || null,
            dataFim:
              dataFimIntervalo || null
          }
        )

        setMensagem(
          '✅ Intervalo atualizado com sucesso.'
        )

      } else {

        await api.post(
          '/agenda/intervalo-recorrente',
          {
            diaSemana: diaSemanaIntervalo,
            horaInicio: horaInicioIntervalo,
            horaFim: horaFimIntervalo,
            descricao: descricaoIntervalo,
            dataInicio:
              dataInicioIntervalo || null,
            dataFim:
              dataFimIntervalo || null
          }
        )

        setMensagem(
          '✅ Intervalo criado com sucesso.'
        )

      }

      setMensagem(
        '✅ Intervalo criado com sucesso.'
      )

      setDescricaoIntervalo('')
      setDiaSemanaIntervalo(1)
      setHoraInicioIntervalo('12:00')
      setHoraFimIntervalo('13:00')
      setDataInicioIntervalo('')
      setDataFimIntervalo('')

      await carregarIntervalos()
      setIntervaloEditandoId(null)

    } catch (err: any) {

      setErro(
        err.response?.data?.mensagem ||
        'Erro ao criar intervalo.'
      )

    }

  }

  function editarIntervalo(intervalo: any) {

    setIntervaloEditandoId(
      intervalo.Id
    )

    setDescricaoIntervalo(
      intervalo.Descricao
    )

    setDiaSemanaIntervalo(
      intervalo.DiaSemana
    )

    setHoraInicioIntervalo(
      intervalo.HoraInicio
    )

    setHoraFimIntervalo(
      intervalo.HoraFim
    )

    setDataInicioIntervalo(
      intervalo.DataInicio
        ? intervalo.DataInicio.split('T')[0]
        : ''
    )

    setDataFimIntervalo(
      intervalo.DataFim
        ? intervalo.DataFim.split('T')[0]
        : ''
    )

  }

  async function ativarIntervalo(id: number) {

    try {

      await api.patch(
        `/agenda/intervalo-recorrente/${id}/ativar`
      )

      setMensagem(
        '✅ Intervalo ativado com sucesso.'
      )

      await carregarIntervalos()

    } catch {

      setErro(
        'Erro ao ativar intervalo.'
      )

    }

  }

  async function desativarIntervalo(id: number) {

    try {

      await api.patch(
        `/agenda/intervalo-recorrente/${id}/desativar`
      )

      setMensagem(
        '✅ Intervalo desativado com sucesso.'
      )

      await carregarIntervalos()

    } catch {

      setErro(
        'Erro ao desativar intervalo.'
      )

    }

  }

  async function excluirIntervalo(id: number) {

    const confirmar = window.confirm(
      'Deseja realmente excluir este intervalo?'
    )

    if (!confirmar) return

    try {

      await api.delete(
        `/agenda/intervalo-recorrente/${id}`
      )

      setMensagem(
        '✅ Intervalo excluído com sucesso.'
      )

      await carregarIntervalos()

    } catch {

      setErro(
        'Erro ao excluir intervalo.'
      )

    }

  }

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
      await api.patch(`/agenda/base/${id}/ativar`)
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
    carregarRegraSabado()
    carregarIntervalos()
  }, [])


  return (
    <div className="config-agenda-container">
      <h1>Configurar Agenda</h1>

      <p className="config-agenda-subtitulo">
        Configure os horários de funcionamento
        e a disponibilidade da agenda.
      </p>

      <div className="agenda-abas">

        <button
          className={
            abaAtiva === 'liberacao'
              ? 'aba-ativa'
              : ''
          }
          onClick={() =>
            setAbaAtiva('liberacao')
          }
        >
          Liberação da Agenda
        </button>

        <button
          className={
            abaAtiva === 'horarios'
              ? 'aba-ativa'
              : ''
          }
          onClick={() =>
            setAbaAtiva('horarios')
          }
        >
          Horários Semanais
        </button>

        <button
          className={
            abaAtiva === 'sabados'
              ? 'aba-ativa'
              : ''
          }
          onClick={() =>
            setAbaAtiva('sabados')
          }
        >
          Sábados Alternados
        </button>

        <button
          className={
            abaAtiva === 'intervalos'
              ? 'aba-ativa'
              : ''
          }
          onClick={() =>
            setAbaAtiva('intervalos')
          }
        >
          Intervalos Recorrentes
        </button>

      </div>

      {mensagem && (<div className="config-sucesso"> {mensagem} </div>)}
      {erro && (<div className="config-erro">{erro} </div>)}

      {/* ✅ 🔥 NOVA SEÇÃO */}
      {abaAtiva === 'liberacao' && (
        <div className="config-card">
          <h3>Liberação da Agenda</h3>


          <div className="status-agenda-card">

            {dataLimite
              ? ` Agenda aberta até ${formatarDataBR(dataLimite)}`
              : diasLiberacao > 0
                ? `✅ Agenda aberta por ${diasLiberacao} dias`
                : '🔒 Agenda fechada'}

          </div>

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

          <p>📆 Abrir agenda até uma data específica:</p>

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

          {!dataLimite && diasLiberacao === 0 && (
            <div className="agenda-fechada-msg">
              🔒 Agenda fechada no momento.
            </div>
          )}
        </div>
      )}


      {abaAtiva === 'horarios' && (
        <>


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

          <div className="dias-semana-grid">

            {!loading &&
              agendaBase.map(dia => {
                if (dia.diaSemana === 6) {
                  return null
                }
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
        </>
      )}
      {abaAtiva === 'sabados' && (
        <div className="config-card">
          <h3>Sábados Alternados</h3>

          <div
            className={
              sabadoAtivo
                ? 'status-dia-aberto'
                : 'status-dia-fechado'
            }
          >
            {sabadoAtivo
              ? 'REGRA ATIVA'
              : 'REGRA INATIVA'}
          </div>

          <div className="campo-horario">

            <label>Data Inicial</label>

            <input
              type="date"
              value={dataInicioSabado}
              onChange={(e) =>
                setDataInicioSabado(
                  e.target.value
                )
              }
            />

          </div>

          <div className="linha-horarios">

            <div className="campo-horario">

              <label>Hora Inicial</label>

              <select
                value={horaInicioSabado}
                onChange={(e) =>
                  setHoraInicioSabado(
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

            <div className="campo-horario">

              <label>Hora Final</label>

              <select
                value={horaFimSabado}
                onChange={(e) =>
                  setHoraFimSabado(
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

          <div
            style={{
              marginTop: 16,
              display: 'flex',
              gap: 12
            }}
          >

            <button
              className="btn-config"
              onClick={salvarRegraSabado}
            >
              {regraSabadoId
                ? 'Atualizar Regra'
                : 'Criar Regra'}
            </button>
            {sabadoAtivo && (

              <button
                className="btn-config"
                onClick={desativarRegraSabado}
              >
                Desativar Regra
              </button>

            )}

          </div>
        </div>
      )}

      {abaAtiva === 'intervalos' && (
        <div className="config-card">
          <h3>Intervalos Recorrentes</h3>

          <div className="campo-horario">

            <label>Descrição</label>

            <input
              type="text"
              value={descricaoIntervalo}
              onChange={(e) =>
                setDescricaoIntervalo(
                  e.target.value
                )
              }
              placeholder="Ex: Almoço"
            />

          </div>

          <div className="campo-horario">

            <label>Dia da Semana</label>

            <select
              value={diaSemanaIntervalo}
              onChange={(e) =>
                setDiaSemanaIntervalo(
                  Number(e.target.value)
                )
              }
            >
              <option value={1}>
                Segunda-feira
              </option>

              <option value={2}>
                Terça-feira
              </option>

              <option value={3}>
                Quarta-feira
              </option>

              <option value={4}>
                Quinta-feira
              </option>

              <option value={5}>
                Sexta-feira
              </option>

              <option value={6}>
                Sábado
              </option>

              <option value={0}>
                Domingo
              </option>

            </select>

          </div>

          <div className="linha-horarios">

            <div className="campo-horario">

              <label>Hora Inicial</label>

              <select
                value={horaInicioIntervalo}
                onChange={(e) =>
                  setHoraInicioIntervalo(
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

            <div className="campo-horario">

              <label>Hora Final</label>

              <select
                value={horaFimIntervalo}
                onChange={(e) =>
                  setHoraFimIntervalo(
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

          <div className="linha-horarios">

            <div className="campo-horario">

              <label>Válido a partir de</label>

              <input
                type="date"
                value={dataInicioIntervalo}
                onChange={(e) =>
                  setDataInicioIntervalo(
                    e.target.value
                  )
                }
              />

            </div>

            <div className="campo-horario">

              <label>Válido até</label>

              <input
                type="date"
                value={dataFimIntervalo}
                onChange={(e) =>
                  setDataFimIntervalo(
                    e.target.value
                  )
                }
              />

            </div>

          </div>

          <button
            className="btn-config"
            onClick={salvarIntervalo}
          >
            {intervaloEditandoId
              ? 'Atualizar Intervalo'
              : 'Salvar Intervalo'}
          </button>

          <hr />

          {intervalos.length === 0 && (
            <p>
              Nenhum intervalo recorrente cadastrado.
            </p>
          )}

          {intervalos.map(intervalo => (

            <div
              key={intervalo.Id}
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '12px'
              }}
            >

              <strong>
                {intervalo.Descricao}
              </strong>

              <p>
                {nomeDiaSemana(intervalo.DiaSemana)}
              </p>

              <p>
                {intervalo.HoraInicio}
                {' às '}
                {intervalo.HoraFim}
              </p>

              <p>
                {intervalo.Ativo
                  ? '✅ Ativo'
                  : '⛔ Inativo'}
              </p>

              {(intervalo.DataInicio ||
                intervalo.DataFim) && (

                  <p>

                    Vigência:

                    {' '}

                    {intervalo.DataInicio
                      ? intervalo.DataInicio
                      : 'Sem início'}

                    {' até '}

                    {intervalo.DataFim
                      ? intervalo.DataFim
                      : 'Sem fim'}

                  </p>

                )}

              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  marginTop: '12px'
                }}
              >

                <button
                  className="btn-config"
                  onClick={() =>
                    editarIntervalo(intervalo)
                  }
                >
                  Editar
                </button>

                {intervalo.Ativo ? (

                  <button
                    className="btn-config"
                    onClick={() =>
                      desativarIntervalo(intervalo.Id)
                    }
                  >
                    Desativar
                  </button>

                ) : (

                  <button
                    className="btn-config"
                    onClick={() =>
                      ativarIntervalo(intervalo.Id)
                    }
                  >
                    Ativar
                  </button>

                )}

                <button
                  className="btn-config"
                  onClick={() =>
                    excluirIntervalo(intervalo.Id)
                  }
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}