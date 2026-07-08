import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { useNavigate, useSearchParams } from 'react-router-dom'

import {
  formatarMoeda
} from '../utils/relatorios'

type ClienteRelatorio = {
  clienteId: number
  cliente: string
  totalProcedimentos: number
  valorGasto: number
  frequenciaMedia: number
}

function obterPeriodoMesAtual() {
  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = hoje.getMonth()
  const primeiroDia = new Date(ano, mes, 1)

  return {
    dataInicio: primeiroDia.toISOString().slice(0, 10),
    dataFim: hoje.toISOString().slice(0, 10)
  }
}

export default function RelatorioClientes() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const clienteId = searchParams.get('clienteId')

  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [clientes, setClientes] = useState<ClienteRelatorio[]>([])
  const [loading, setLoading] = useState(false)

  async function gerarRelatorio(
    inicio?: string,
    fim?: string
  ) {
    const ini = inicio ?? dataInicio
    const fimData = fim ?? dataFim

    if (!ini || !fimData) {
      alert('Selecione o período')
      return
    }

    setLoading(true)

    try {
      const resp = await api.get('/relatorios/clientes', {
        params: {
          dataInicio: ini,
          dataFim: fimData,
          clienteId: clienteId || undefined
        }
      })
      setClientes(resp.data)
    } catch {
      alert('Erro ao gerar relatório de clientes')
    } finally {
      setLoading(false)
    }
  }

  // ✅ GERA AUTOMATICAMENTE SE VEIO DA LISTA DE CLIENTES
  useEffect(() => {
    if (!clienteId) return

    const { dataInicio, dataFim } = obterPeriodoMesAtual()
    setDataInicio(dataInicio)
    setDataFim(dataFim)

    setTimeout(() => {
      gerarRelatorio(dataInicio, dataFim)
    }, 0)
  }, [clienteId])

  return (
    <div style={{ maxWidth: 900 }}>
      <button onClick={() => navigate(-1)}>
        ← Voltar
      </button>

      <h1>Relatório de Clientes</h1>

      <div>
        <label>
          Data início:
          <input
            type="date"
            value={dataInicio}
            onChange={e => setDataInicio(e.target.value)}
          />
        </label>

        <label>
          Data fim:
          <input
            type="date"
            value={dataFim}
            onChange={e => setDataFim(e.target.value)}
          />
        </label>

        <button onClick={() => gerarRelatorio()} disabled={loading}>
          {loading ? 'Gerando...' : 'Gerar Relatório'}
        </button>
      </div>

      {clientes.length > 0 && (
        <table border={1} cellPadding={6} style={{ marginTop: 20 }}>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Cliente</th>
              <th>Procedimentos</th>
              <th>Valor Gasto</th>
              <th>Frequência média (por mês)</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((c, index) => (
              <tr key={c.clienteId}>
                <td><strong>{index + 1}</strong></td>
                <td>{c.cliente}</td>
                <td>{c.totalProcedimentos}</td>
                <td>{formatarMoeda(c.valorGasto)}</td>
                <td>{c.frequenciaMedia}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
