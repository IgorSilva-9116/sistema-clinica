import {
  gerarCSV,
  baixarCSV,
  formatarMoeda
} from '../utils/relatorios'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js'

import { Bar } from 'react-chartjs-2'

import {
  useRelatoriosContext
} from '../contexts/RelatoriosContext'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
)

export default function DashboardRelatorios() {

  const {
    resumo,
    comparacao,
    metaMensal,
    despesasResumo,
    atualizarMeta,
    salvarMetaBackend
  } = useRelatoriosContext()

  const receitaTotal =
    resumo
      ? resumo.faturamento +
        resumo.totalMultas
      : 0

  const lucroLiquido =
    resumo
      ? resumo.faturamento +
        resumo.totalMultas -
        despesasResumo.totalDespesasPagas
      : 0
   
  const percentualMeta =
    metaMensal > 0
      ? (receitaTotal / metaMensal) * 100
      : 0   
      
  function exportarResumo() {

  const csv = gerarCSV([
    {
      Receita: receitaTotal,

      Despesas:
        despesasResumo.totalDespesasPagas,

      Lucro:
        lucroLiquido,

      Crescimento:
        comparacao.crescimento,

      Meta:
        metaMensal
    }
  ])

  baixarCSV(
    csv,
    'resumo-financeiro.csv'
  )
}    

  return (
    <div>

      <h2>📊 Indicadores Principais</h2>

      <button
        className="export-button"
        onClick={exportarResumo}
      >
       📥 Exportar Resumo
      </button>

      <div className="cards">

        <div className="card receita">
          Receita
          <br />
          {formatarMoeda(receitaTotal)}
        </div>

        <div className="card despesa">
          Despesas
          <br />
          {formatarMoeda(
            despesasResumo.totalDespesasPagas
          )}
        </div>

        <div className="card lucro">
          Lucro
          <br />
          {formatarMoeda(lucroLiquido)}
        </div>

        <div className="card crescimento">
          Crescimento
          <br />
          {comparacao.crescimento.toFixed(1)}%
        </div>

        <div className="card meta">
          Meta
          <br />
          {formatarMoeda(metaMensal)}
        </div>

      </div>

      <h2 className="section">
        📈 Desempenho
      </h2>

      <div className="dashboard-grid">

        <div className="dashboard-box">

          <h3>🎯 Meta Mensal</h3>

        <div className="meta-controls">

          <input
            className="meta-input"
            type="number"
            min={0}
            step={100}
            value={metaMensal}
            onChange={(e) =>
              atualizarMeta(
                Number(
                  e.target.value
                )
              )
            }
          />

          <button
            onClick={salvarMetaBackend}
          >
           💾 Salvar
          </button>

      </div>

      <p>
        Meta:
        {' '}
        {formatarMoeda(metaMensal)}
      </p>

      <p>
        Receita Atual:
        {' '}
        {formatarMoeda(receitaTotal)}
      </p>

      <p>
        Progresso:
        {' '}
        {percentualMeta.toFixed(1)}%
      </p>

      <div className="meta-progress">

      <div
          className="meta-progress-bar"
          style={{
            width: `${Math.min(percentualMeta,100)}%`,
            background:
              percentualMeta >= 100
                ? '#2e7d32'
                : percentualMeta >= 50
                ? '#f9a825'
                : '#d32f2f'
          }}
        />
      </div>

        </div>

        <div className="dashboard-box">

          <h3>📊 Faturamento</h3>

           <div className="dashboard-chart">

            <Bar
              data={{
                labels: ['Período'],

                datasets: [
                  {
                    label: 'Receita',

                    data: [receitaTotal],

                    backgroundColor:
                      '#1976D2',

                    borderRadius: 8
                  }
                ]
              }}
              options={{
                responsive: true,
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

    </div>
  )
}