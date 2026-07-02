import { useState } from 'react'
import { api } from '../services/api'
import { NavLink, Outlet } from 'react-router-dom'
import '../styles/relatorios.css'


import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
)

type Resumo = {
  totalAtendimentos: number
  diasComAtendimento: number
  horasTrabalhadas: number
  faturamento: number
  totalMultas: number
}

type FaturamentoServico = {
  Servico: string
  TotalExecucoes: number
  TotalFaturado: number
}

function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
}

/* =======================
   CSV HELPERS
======================= */
function gerarCSV(dados: any[]) {
  if (!dados || dados.length === 0) return ''

  const colunas = Object.keys(dados[0])
  const linhas = dados.map(item =>
    colunas.map(col => `"${item[col] ?? ''}"`).join(';')
  )

  return [colunas.join(';'), ...linhas].join('\n')
}

function baixarCSV(conteudo: string, nomeArquivo: string) {
  const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', nomeArquivo)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/* =======================
   PERÍODO MÊS ATUAL
======================= */
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

export default function Relatorios() {
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [loading, setLoading] = useState(false)

  const [resumo, setResumo] = useState<Resumo | null>(null)
  const [faturamentoServico, setFaturamentoServico] = useState<FaturamentoServico[]>([])

  // ✅ META DINÂMICA (localStorage)
  const [metaMensal, setMetaMensal] = useState(() => {
    const salva = localStorage.getItem('metaMensal')
    return salva ? Number(salva) : 0
  })

  const [comparacao, setComparacao] = useState({
  faturamentoAtual: 0,
  faturamentoAnterior: 0,
  crescimento: 0
})


  // ✅ NOVO STATE DE DESPESAS
  const [despesasResumo, setDespesasResumo] = useState({
    totalDespesasPagas: 0,
    totalDespesasPendentes: 0
  })
  const [mesFechado, setMesFechado] = useState(false)

  async function gerarRelatorio() {
    if (!dataInicio || !dataFim) {
      alert('Selecione o período')
      return
    }

    setLoading(true)

    try {
      const resumoResp = await api.get('/relatorios/resumo', {
        params: { dataInicio, dataFim }
      })

      const faturamentoResp = await api.get('/relatorios/faturamento-servico', {
        params: { dataInicio, dataFim }
      })

      // ✅ NOVA CHAMADA DE DESPESAS
      const despesasResp = await api.get('/relatorios/despesas', {
        params: { dataInicio, dataFim }
      })

      const statusResp = await api.get('/relatorios/status-mes', {
        params: { dataInicio, dataFim }
      })

      setMesFechado(statusResp.data.fechado)

      const r = resumoResp.data

      setResumo({
        totalAtendimentos: r.totalAtendimentos ?? 0,
        diasComAtendimento: r.diasComAtendimento ?? 0,
        horasTrabalhadas: r.horasTrabalhadas ?? 0,
        faturamento: r.faturamento ?? 0,
        totalMultas: r.totalMultas ?? 0
      })

      const comparacaoResp = await api.get('/relatorios/comparacao', {
       params: { dataInicio, dataFim }
       })

      setComparacao(comparacaoResp.data)


     const despesasData = despesasResp.data

     setDespesasResumo({
       totalDespesasPagas: despesasData?.totalDespesasPagas ?? despesasData?.dados?.totalDespesasPagas ?? 0,
       totalDespesasPendentes: despesasData?.totalDespesasPendentes ?? despesasData?.dados?.totalDespesasPendentes ?? 0
      })

      setFaturamentoServico(
        faturamentoResp.data.map((item: any) => ({
          Servico: item.Servico,
          TotalExecucoes: item.TotalExecucoes ?? 0,
          TotalFaturado: item.TotalFaturado ?? 0
        }))
      )
    } catch {
      alert('Erro ao gerar relatório')
    } finally {
      setLoading(false)
    }
  }

  const faturamentoMedioDiario =
    resumo && resumo.diasComAtendimento > 0
      ? resumo.faturamento / resumo.diasComAtendimento
      : 0

  // ✅ NOVO CÁLCULO DE LUCRO
  const lucroLiquido =
    resumo
      ? resumo.faturamento +
        resumo.totalMultas -
        despesasResumo.totalDespesasPagas
      : 0
  
    const receitaTotal =
    resumo ? resumo.faturamento + resumo.totalMultas : 0

    const percentualMeta =
      metaMensal > 0
      ? (receitaTotal / metaMensal) * 100
      : 0

    function getCorMeta(percentual: number) {
      if (percentual >= 100) return '#2e7d32'
     if (percentual >= 50) return '#f9a825'
     return '#d32f2f'
    }

    function atualizarMeta(valor: number) {
      setMetaMensal(valor)
      localStorage.setItem('metaMensal', valor.toString())
    }  
     
    // ✅ SALVAR META NO BACKEND
    async function salvarMetaBackend() {
      try {
      await api.post('/relatorios/meta', {
       valor: metaMensal
      })

       alert('Meta salva com sucesso!')
      }  catch (err) {
       alert('Erro ao salvar meta')
      }
    }

    async function fecharMesBackend() {
      try {
      await api.post('/relatorios/fechar-mes', {
       dataInicio,
       dataFim
     })
      setMesFechado(true)
      alert('Mês fechado com sucesso!')
      } catch (err: any) {
      alert(err?.response?.data?.mensagem || 'Erro ao fechar mês')
      }
    }

return (
  <div className="container">
    <h1>Relatórios</h1>

    <div style={{ marginBottom: 20 }}>
      <NavLink
        to=""
        end
        style={({ isActive }) => ({
          marginRight: 15,
          fontWeight: isActive ? 'bold' : 'normal',
          textDecoration: isActive ? 'underline' : 'none'
        })}
      >
        Resumo Financeiro
      </NavLink>

      <NavLink
        to="clientes"
        style={({ isActive }) => ({
          fontWeight: isActive ? 'bold' : 'normal',
          textDecoration: isActive ? 'underline' : 'none'
        })}
      >
        Relatório de Clientes
      </NavLink>
    </div>

    <button
      type="button"
      style={{ marginBottom: 10 }}
      onClick={() => {
        const { dataInicio, dataFim } = obterPeriodoMesAtual()
        setDataInicio(dataInicio)
        setDataFim(dataFim)
      }}
    >
      Fechar mês atual
    </button>

   
    {/* ✅ FILTROS COM CSS */}
    <div className="filtros">
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

      <button onClick={gerarRelatorio} disabled={loading || mesFechado}>
        {loading ? 'Gerando...' : 'Gerar Relatório'}
      </button>

      <button onClick={fecharMesBackend} disabled={mesFechado}>
        🔒 Fechar mês
      </button>
    </div>

    {mesFechado && (
      <p className="status-fechado">
        🔒 Este período está fechado
      </p>
    )}
    

    <Outlet />

{resumo && (
      <>
        <h2>Resumo do Período</h2>

        <button
          onClick={() => {
            const csv = gerarCSV([{
              TotalAtendimentos: resumo.totalAtendimentos,
              DiasComAtendimento: resumo.diasComAtendimento,
              HorasTrabalhadas: resumo.horasTrabalhadas,
              Faturamento: resumo.faturamento,
              Multas: resumo.totalMultas,
              ReceitaTotal: resumo.faturamento + resumo.totalMultas,
              FaturamentoMedioDiario: faturamentoMedioDiario,
              DespesasPagas: despesasResumo.totalDespesasPagas,
              DespesasPendentes: despesasResumo.totalDespesasPendentes,
              LucroLiquido: lucroLiquido
            }])
            baixarCSV(csv, 'resumo-financeiro.csv')
          }}
        >
          Exportar Resumo (CSV)
        </button>

        {/* ✅ CARDS */}
        <div className="cards">
          <div className="card receita">
            Receita<br />
            {formatarMoeda(resumo.faturamento + resumo.totalMultas)}
          </div>

          <div className="card despesa">
            Despesas<br />
            {formatarMoeda(despesasResumo.totalDespesasPagas)}
          </div>

          <div className="card lucro">
            Lucro<br />
            <span style={{
              color: lucroLiquido >= 0 ? 'white' : '#ffebee'
              }}>
            </span>
            {formatarMoeda(lucroLiquido)}
          </div>
        </div>

        <div className="card crescimento">
          Crescimento <br />

          <span style={{ fontSize: 18, fontWeight: 'bold' }}>
           {comparacao.crescimento >= 0 ? '📈' : '📉'}{' '}
           {comparacao.crescimento.toFixed(1)}%
          </span>
            <small style={{ display: 'block', marginTop: 5 }}>
              vs período anterior: {formatarMoeda(comparacao.faturamentoAnterior)}
            </small>
        </div>
              
        {/* ✅ LISTA ORIGINAL (mantida) */}
        <ul>
          <li>📋 Total de atendimentos: {resumo.totalAtendimentos}</li>
          <li>📅 Dias com atendimento: {resumo.diasComAtendimento}</li>
          <li>⏱️ Horas trabalhadas: {resumo.horasTrabalhadas}</li>
          <li>💼 Faturamento com serviços: {formatarMoeda(resumo.faturamento)}</li>
          <li>⚠️ Multas: {formatarMoeda(resumo.totalMultas)}</li>
          <li>📊 Receita total: {formatarMoeda(resumo.faturamento + resumo.totalMultas)}</li>
          <li>💸 Despesas pagas: {formatarMoeda(despesasResumo.totalDespesasPagas)}</li>
          <li>🕒 Despesas pendentes: {formatarMoeda(despesasResumo.totalDespesasPendentes)}</li>

          <li style={{
            color: lucroLiquido >= 0 ? '#2e7d32' : '#d32f2f',
            fontSize: 18,
            marginTop: 10
          }}>
            <strong>💰 Lucro líquido: {formatarMoeda(lucroLiquido)}</strong>
          </li>

          <li>📈 Faturamento médio diário: {formatarMoeda(faturamentoMedioDiario)}</li>
        </ul>

{/* ✅ DASHBOARD GRID */}
<div className="dashboard-grid">

  {/* ✅ META */}
  <div className="dashboard-box">
  <h3>🎯 Meta Mensal</h3>

  <div className="meta-actions">
    <input
      type="number"
      value={metaMensal}
      onChange={(e) => atualizarMeta(Number(e.target.value))}
    />

    <button onClick={salvarMetaBackend}>
      💾 Salvar
    </button>
  </div>

  <p>Meta: {formatarMoeda(metaMensal)}</p>
  <p>Receita atual: {formatarMoeda(receitaTotal)}</p>

  <p style={{ color: getCorMeta(percentualMeta), fontWeight: 'bold' }}>
    Progresso: {percentualMeta.toFixed(1)}%
  </p>

  <div style={{
    width: '100%',
    background: '#eee',
    height: 10,
    borderRadius: 5
  }}>
    <div style={{
      width: `${Math.min(percentualMeta, 100)}%`,
      background: getCorMeta(percentualMeta),
      height: '100%',
      borderRadius: 5
    }} />
  </div>
</div>

  {/* ✅ GRÁFICO FATURAMENTO */}
  <div className="dashboard-box">
    <h3>📊 Faturamento</h3>

    <div className="grafico-box">
      <Bar
  data={{
    labels: ['Período'],
    datasets: [
      {
        label: 'Faturamento',
        data: [resumo.faturamento],
        backgroundColor: '#2196F3'
      }
    ]
  }}
  options={{
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    }
  }}
/>

    </div>
  </div>

</div>

{/* ✅ RESULTADO FINANCEIRO */}
<h3 className="section">💰 Resultado Financeiro</h3>

<div className="grafico-container">
  <Bar
    data={{
      labels: ['Período'],
      datasets: [
        {
          label: 'Receita Total',
          data: [resumo.faturamento + resumo.totalMultas],
          backgroundColor: '#2196F3'
        },
        {
          label: 'Despesas Pagas',
          data: [despesasResumo.totalDespesasPagas],
          backgroundColor: '#F44336'
        },
        {
          label: 'Lucro Líquido',
          data: [lucroLiquido],
          backgroundColor: '#4CAF50'
        }
      ]
    }}
    options={{ maintainAspectRatio: false }}
  />
</div>

</>
)}

{/* ✅ FATURAMENTO POR SERVIÇO */}
{faturamentoServico.length > 0 && (
  <>
   <h2 className="section">Faturamento por Serviço</h2>

    <table border={1} cellPadding={6} style={{ marginTop: 10 }}>
      <thead>
        <tr>
          <th>Serviço</th>
          <th>Execuções</th>
          <th>Total Faturado</th>
        </tr>
      </thead>
      <tbody>
        {faturamentoServico.map((item, index) => (
          <tr key={index}>
            <td>{item.Servico}</td>
            <td>{item.TotalExecucoes}</td>
            <td>{formatarMoeda(item.TotalFaturado)}</td>
          </tr>
        ))}
      </tbody>
    </table>

    <h3>📊 Faturamento por Serviço</h3>

    <div className="grafico-container">
      <Bar
        data={{
          labels: faturamentoServico.map(f => f.Servico),
          datasets: [
            {
              label: 'Faturamento por Serviço',
              data: faturamentoServico.map(f => f.TotalFaturado),
              backgroundColor: '#4CAF50'
            }
          ]
        }}
        options={{ maintainAspectRatio: false }}
      />
    </div>
  </>
)}

</div>
)
}
