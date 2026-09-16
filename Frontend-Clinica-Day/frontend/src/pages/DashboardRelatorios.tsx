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

import {
  FaSackDollar,
  FaArrowTrendDown,
  FaArrowTrendUp,
  FaChartColumn
} from 'react-icons/fa6'

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

      <div className="dashboard-header">
      
        <button
          className="export-button"
          onClick={exportarResumo}
        >
          📥 Exportar Resumo
        </button>

      </div>

      <div className="cards">

        <div className="card receita">

          <div className="card-icon">
            <FaSackDollar />
          </div>

          <div className="card-content">

            <span>
              Receita
            </span>

            <strong>
              {formatarMoeda(receitaTotal)}
            </strong>

          </div>

        </div>

        <div className="card despesa">

          <div className="card-icon">
            <FaArrowTrendDown />
          </div>

          <div className="card-content">

            <span>
              Despesas
            </span>

            <strong>
              {formatarMoeda(
                despesasResumo.totalDespesasPagas
              )}
            </strong>

          </div>

        </div>

        <div className="card lucro">

          <div className="card-icon">
            <FaArrowTrendUp />
          </div>

          <div className="card-content">

            <span>
              Lucro
            </span>

            <strong>
              {formatarMoeda(lucroLiquido)}
            </strong>

          </div>

        </div>

        <div className="card crescimento">

          <div className="card-icon">
            <FaChartColumn />
          </div>

          <div className="card-content">

            <span>
              Crescimento
            </span>

            <strong>
              {comparacao.crescimento.toFixed(1)}%
            </strong>

          </div>

        </div>

      </div>
 
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

          <div className="meta-info">

            <div className="meta-item">
              <span>Meta</span>

              <strong>
                {formatarMoeda(metaMensal)}
              </strong>
            </div>

            <div className="meta-item">
              <span>Receita Atual</span>

              <strong>
                {formatarMoeda(receitaTotal)}
              </strong>
            </div>

            <div className="meta-item">
              <span>Faltam</span>

              <strong>
                {formatarMoeda(
                  Math.max(
                    metaMensal - receitaTotal,
                    0
                  )
                )}
              </strong>
            </div>

            <div className="meta-item">
              <span>Progresso</span>

              <strong>
                {percentualMeta.toFixed(1)}%
              </strong>
            </div>

          </div>

          <div className="meta-progress">

            <div
              className="meta-progress-bar"
              style={{
                width: `${Math.min(percentualMeta, 100)}%`,
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

                    backgroundColor: '#c57f5f',

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