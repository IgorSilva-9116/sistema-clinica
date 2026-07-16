import { useEffect, useState } from 'react'
import { api } from '../services/api'
import '../styles/agendaExcecoes.css'

type ExcecaoAgenda = {
  Id: number
  TipoExcecao: 'ABRIR' | 'FECHAR'
  DataInicio: string | null
  DataFim: string | null
  Data: string
  HoraInicio: string
  HoraFim: string
  Observacao?: string
  Ativa: boolean
}

function formatarDataBR(dataISO: string) {
  // evita problema de timezone
  return dataISO.split('T')[0].split('-').reverse().join('/')
}

export default function GerenciarExcecoes() {
  const [excecoes, setExcecoes] = useState<ExcecaoAgenda[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [horaInicio, setHoraInicio] = useState('')
  const [horaFim, setHoraFim] = useState('')
  const [tipoExcecao, setTipoExcecao] = useState<'ABRIR' | 'FECHAR'>('FECHAR')
  const [observacao, setObservacao] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState<string | null>(null)

  useEffect(() => {

    if (!erro && !sucesso) return

    const timer = setTimeout(() => {

      setErro(null)
      setSucesso(null)

    }, 5000)

    return () => clearTimeout(timer)

  }, [erro, sucesso])

  async function carregarExcecoes() {
    setLoading(true)
    setErro(null)
    try {
      const resp = await api.get('/agenda/excecao/todas')
      setExcecoes(resp.data?.excecoes ?? [])
    } catch {
      setErro('Erro ao carregar exceções.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarExcecoes()
  }, [])


  async function criarExcecaoPeriodo() {
    if (!dataInicio || !dataFim) {
      alert('Informe a data de início e fim.')
      return
    }

    // ✅ REGRA B: ABRIR exige horário
    if (tipoExcecao === 'ABRIR' && (!horaInicio || !horaFim)) {
      alert(
        'Para abrir um dia fora da rotina semanal, informe o horário de funcionamento.'
      )
      return
    }

    const inicioFinal =
      tipoExcecao === 'FECHAR' && !horaInicio ? '00:00' : horaInicio
    const fimFinal =
      tipoExcecao === 'FECHAR' && !horaFim ? '23:59' : horaFim

    setSalvando(true)

    try {
      await api.post('/agenda/excecao-periodo', {
        dataInicio,
        dataFim,
        horaInicio: inicioFinal,
        horaFim: fimFinal,
        tipoExcecao,
        observacao
      })

      setSucesso('Exceção criada com sucesso.')

      setDataInicio('')
      setDataFim('')
      setHoraInicio('')
      setHoraFim('')
      setTipoExcecao('FECHAR')
      setObservacao('')

      await carregarExcecoes()
    } catch {
      setErro('Erro ao criar exceção.')
    } finally {
      setSalvando(false)
    }
  }

  const horariosExcecao = Array.from(
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

  return (
    <div className="excecoes-container">
      <h1>Gerenciar Exceções</h1>

      <p className="excecoes-subtitulo">
        Configure feriados, folgas,
        plantões e horários especiais.
      </p>

      {erro && (
        <div className="excecoes-erro">
          ⚠️ {erro}
        </div>
      )}

      {sucesso && (
        <div className="excecoes-sucesso">
          ✅ {sucesso}
        </div>
      )}

      <div className="excecao-card">

        <div className="card-titulo">
          Nova Exceção
        </div>

        <div className="card-subtitulo">
          Crie períodos especiais de abertura
          ou fechamento da agenda.
        </div>

        <p>
          <strong>Fechar agenda</strong>: feriados, almoço, ausências.<br />
          <strong>Abrir agenda</strong>: sábados, plantões, horários extras.
        </p>

        <div className="campo">
          <label>Tipo</label>

          <select
            value={tipoExcecao}
            onChange={e =>
              setTipoExcecao(
                e.target.value as 'ABRIR' | 'FECHAR'
              )
            }
          >
            <option value="FECHAR">
              Fechar agenda
            </option>

            <option value="ABRIR">
              Abrir agenda
            </option>
          </select>
        </div>
        <div className="linha-dupla">

          <div className="campo">
            <label>Data início</label>

            <input
              type="date"
              value={dataInicio}
              onChange={e =>
                setDataInicio(e.target.value)
              }
            />
          </div>

          <div className="campo">
            <label>Data fim</label>

            <input
              type="date"
              value={dataFim}
              onChange={e =>
                setDataFim(e.target.value)
              }
            />
          </div>

        </div>

        <div className="linha-dupla">

          <div className="campo">

            <label>Hora início</label>

            <select
              value={horaInicio}
              onChange={e =>
                setHoraInicio(e.target.value)
              }
            >

              <option value="">
               Escolha um horário
              </option>

              {horariosExcecao.map(h => (
                <option
                  key={h}
                  value={h}
                >
                  {h}
                </option>
              ))}

            </select>

          </div>

          <div className="campo">

            <label>Hora fim</label>

            <select
              value={horaFim}
              onChange={e =>
                setHoraFim(e.target.value)
              }
            >

              <option value="">
                Escolha um horário
              </option>

              {horariosExcecao.map(h => (
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

        <div className="campo">
          <label>Observação</label>

          <input
            type="text"
            value={observacao}
            onChange={e =>
              setObservacao(e.target.value)
            }
            placeholder="Ex: Feriado, almoço, horário especial..."
          />
        </div>

        <div className="acoes-formulario">

          <button
            className="btn-criar-excecao"
            onClick={criarExcecaoPeriodo}
            disabled={salvando}
          >
            {salvando
              ? 'Salvando...'
              : 'Criar Exceção'}
          </button>

        </div>

        <hr />
      </div>

      <div className="lista-excecoes-card">

        <h2 className="lista-titulo">
          Exceções Cadastradas
        </h2>

        {loading && <p>Carregando...</p>}

        {erro && (
          <div className="excecoes-erro">
            ⚠️ {erro}
          </div>
        )}

        {!loading &&
          excecoes.length === 0 && (
            <p>Nenhuma exceção cadastrada.</p>
          )}

        {!loading &&
          excecoes.length > 0 && (

            <div className="tabela-scroll">

              <table className="tabela-excecoes">

                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Período</th>
                    <th>Horário</th>
                    <th>Observação</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {excecoes.map(ex => (
                    <tr key={ex.Id}>
                      <td>

                        <span
                          className={
                            ex.TipoExcecao === 'ABRIR'
                              ? 'tipo-badge tipo-abrir'
                              : 'tipo-badge tipo-fechar'
                          }
                        >
                          {ex.TipoExcecao === 'ABRIR'
                            ? ' ABRIR'
                            : ' FECHAR'}
                        </span>

                      </td>
                      <td className="coluna-periodo">

                        {ex.DataInicio && ex.DataFim
                          ? `${formatarDataBR(ex.DataInicio)} → ${formatarDataBR(ex.DataFim)}`
                          : formatarDataBR(ex.Data)}

                      </td>
                      <td className="coluna-horario">
                        {ex.HoraInicio === '00:00' && ex.HoraFim === '23:59'
                          ? 'Dia inteiro'
                          : `${ex.HoraInicio} – ${ex.HoraFim}`}
                      </td>
                      <td>{ex.Observacao ?? '-'}</td>
                      <td>

                        <span
                          className={
                            ex.Ativa
                              ? 'status-ativa'
                              : 'status-inativa'
                          }
                        >
                          {ex.Ativa
                            ? 'ATIVA'
                            : 'INATIVA'}
                        </span>

                      </td>
                      <td>
                        <div className="acoes-excecao">
                          <button
                            className="btn-acao"
                            onClick={async () => {
                              await api.patch(`/agenda/excecao/${ex.Id}/ativa`, {
                                ativa: !ex.Ativa
                              })
                              await carregarExcecoes()
                            }}
                          >
                            {ex.Ativa ? 'Desativar' : 'Ativar'}
                          </button>
                          <button
                            className="btn-acao btn-remover"
                            onClick={async () => {
                              if (!confirm('Deseja remover esta exceção?')) return
                              await api.delete(`/agenda/excecao/${ex.Id}`)
                              await carregarExcecoes()
                            }}
                          >
                            Remover
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>

            </div>

          )}

      </div>
    </div>
  )
}