import { useEffect, useState } from 'react'
import { api } from '../services/api'

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

      alert('Exceção criada com sucesso.')

      setDataInicio('')
      setDataFim('')
      setHoraInicio('')
      setHoraFim('')
      setTipoExcecao('FECHAR')
      setObservacao('')

      await carregarExcecoes()
    } catch {
      alert('Erro ao criar exceção.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <h1>Gerenciar Exceções</h1>

      <p>
        Use esta tela para feriados, horários especiais, sábados alternados ou
        qualquer exceção fora do funcionamento semanal.
      </p>

      <h2>Criar nova exceção</h2>

      <p>
        <strong>Fechar agenda</strong>: feriados, almoço, ausências.<br />
        <strong>Abrir agenda</strong>: sábados, plantões, horários extras.
      </p>

      <div>
        <label>
          Tipo:{' '}
          <select
            value={tipoExcecao}
            onChange={e =>
              setTipoExcecao(e.target.value as 'ABRIR' | 'FECHAR')
            }
          >
            <option value="FECHAR">Fechar agenda</option>
            <option value="ABRIR">Abrir agenda</option>
          </select>
        </label>
      </div>

      <div>
        <label>
          Data início:{' '}
          <input
            type="date"
            value={dataInicio}
            onChange={e => setDataInicio(e.target.value)}
          />
        </label>
      </div>

      <div>
        <label>
          Data fim:{' '}
          <input
            type="date"
            value={dataFim}
            onChange={e => setDataFim(e.target.value)}
          />
        </label>
      </div>

      <div>
        <label>
          Hora início:{' '}
          <input
            type="time"
            value={horaInicio}
            onChange={e => setHoraInicio(e.target.value)}
          />
        </label>
      </div>

      <div>
        <label>
          Hora fim:{' '}
          <input
            type="time"
            value={horaFim}
            onChange={e => setHoraFim(e.target.value)}
          />
        </label>
      </div>

      <div>
        <label>
          Observação:{' '}
          <input
            type="text"
            value={observacao}
            onChange={e => setObservacao(e.target.value)}
          />
        </label>
      </div>

      <button onClick={criarExcecaoPeriodo} disabled={salvando}>
        Criar exceção
      </button>

      <hr />

      <h2>Exceções cadastradas</h2>

      {loading && <p>Carregando...</p>}
      {erro && <p style={{ color: 'red' }}>{erro}</p>}

      {!loading && excecoes.length === 0 && <p>Nenhuma exceção cadastrada.</p>}

      {!loading && excecoes.length > 0 && (
        <table width="100%">
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
                <td>{ex.TipoExcecao}</td>
                <td>
                  {ex.DataInicio && ex.DataFim
                    ? `${formatarDataBR(ex.DataInicio)} → ${formatarDataBR(
                        ex.DataFim
                      )}`
                    : formatarDataBR(ex.Data)}
                </td>
                <td>
                  {ex.HoraInicio === '00:00' && ex.HoraFim === '23:59'
                    ? 'Dia inteiro'
                    : `${ex.HoraInicio} – ${ex.HoraFim}`}
                </td>
                <td>{ex.Observacao ?? '-'}</td>
                <td>{ex.Ativa ? 'Ativa' : 'Inativa'}</td>
                <td>
                  <button
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
                    style={{ marginLeft: 8, color: 'red' }}
                    onClick={async () => {
                      if (!confirm('Deseja remover esta exceção?')) return
                      await api.delete(`/agenda/excecao/${ex.Id}`)
                      await carregarExcecoes()
                    }}
                  >
                    Remover
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}