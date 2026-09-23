import { useCallback, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import type { RelatoriosOutletContext } from './Relatorios'

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
  LineElement,
  PointElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js'

import {
  FaSackDollar,
  FaArrowTrendDown,
  FaArrowTrendUp,
  FaChartColumn,
  FaBullseye,
  FaCalendarCheck,
  FaUserPlus,
  FaTag,
  FaArrowRotateLeft
} from 'react-icons/fa6'

import { Bar, Line } from 'react-chartjs-2'

import {
  useRelatoriosContext
} from '../contexts/RelatoriosContext'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Filler,
  Tooltip,
  Legend
)

export default function DashboardRelatorios() {

  const {
    resumo,
    comparacao,
    metaMensal,
    despesasResumo,
    indicadoresClientes,
    serieFaturamento,
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

  const margemLucro =
    receitaTotal > 0
      ? (lucroLiquido / receitaTotal) * 100
      : 0

  const percentualMeta =
    metaMensal > 0
      ? (receitaTotal / metaMensal) * 100
      : 0

  const percentualMetaLimitado =
    Math.min(percentualMeta, 100)

  const faltamMeta =
    Math.max(metaMensal - receitaTotal, 0)

  const atendimentosRealizados =
    resumo?.totalAtendimentos ?? 0

  const ticketMedio =
    atendimentosRealizados > 0
      ? receitaTotal / atendimentosRealizados
      : 0

  const { setExportAction } =
    useOutletContext<RelatoriosOutletContext>()

  const exportarResumo = useCallback(() => {

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    receitaTotal,
    despesasResumo.totalDespesasPagas,
    lucroLiquido,
    comparacao.crescimento,
    metaMensal
  ])

  useEffect(() => {

    setExportAction({
      label: 'Exportar Resumo',
      onClick: exportarResumo
    })

    return () => setExportAction(null)

  }, [exportarResumo, setExportAction])

  return (
    <div>

      <div className="cards">

        <div className="card receita">

          <div className="card-icon">
            <FaSackDollar />
          </div>

          <div className="card-content">

            <span>Receita</span>

            <strong>
              {formatarMoeda(receitaTotal)}
            </strong>

            <small>
              Meta: {formatarMoeda(metaMensal)}
            </small>

            <div className="card-progress-mini">
              <div
                className="card-progress-mini-bar"
                style={{
                  width: `${percentualMetaLimitado}%`
                }}
              />
            </div>

          </div>

        </div>

        <div className="card despesa">

          <div className="card-icon">
            <FaArrowTrendDown />
          </div>

          <div className="card-content">

            <span>Despesas</span>

            <strong>
              {formatarMoeda(
                despesasResumo.totalDespesasPagas
              )}
            </strong>

            <small>Total de despesas</small>

          </div>

        </div>

        <div className="card lucro">

          <div className="card-icon">
            <FaArrowTrendUp />
          </div>

          <div className="card-content">

            <span>Lucro</span>

            <strong>
              {formatarMoeda(lucroLiquido)}
            </strong>

            <small>
              Margem: {margemLucro.toFixed(1)}%
            </small>

          </div>

        </div>

        <div className="card crescimento">

          <div className="card-icon">
            <FaChartColumn />
          </div>

          <div className="card-content">

            <span>Crescimento</span>

            <strong>
              {comparacao.crescimento >= 0 ? '+ ' : ''}
              {comparacao.crescimento.toFixed(1)}%
            </strong>

            <small>vs período anterior</small>

          </div>

        </div>

      </div>

      <div className="dashboard-grid">

        <div className="dashboard-box">

          <h3>📈 Desempenho</h3>

          <div className="meta-topo">
            <FaBullseye /> Meta Mensal
          </div>

          <div className="meta-actions">

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

          <div className="meta-linhas">

            <p>
              Meta: <strong>{formatarMoeda(metaMensal)}</strong>
            </p>

            <p>
              Receita Atual: <strong>{formatarMoeda(receitaTotal)}</strong>
            </p>

            <p className="meta-faltam">
              Faltam: <strong>
                {formatarMoeda(faltamMeta)} ({percentualMeta.toFixed(1)}%)
              </strong>
            </p>

          </div>

          <div className="meta-progress-row">

            <div className="meta-progress">
              <div
                className="meta-progress-bar"
                style={{
                  width: `${percentualMetaLimitado}%`,
                  background:
                    percentualMeta >= 100
                      ? '#2e7d32'
                      : percentualMeta >= 50
                        ? '#f9a825'
                        : '#c57f5f'
                }}
              />
            </div>

            <span className="meta-progress-percent">
              {percentualMetaLimitado.toFixed(0)}%
            </span>

          </div>

          {/* Detalhamento antigo em grade — mantido oculto por padrão.
              Remova o comentário abaixo se preferir o layout em 4 caixas
              em vez das linhas acima. */}
          {/*
          <div className="meta-info">
            <div className="meta-item">
              <span>Meta</span>
              <strong>{formatarMoeda(metaMensal)}</strong>
            </div>
            <div className="meta-item">
              <span>Receita Atual</span>
              <strong>{formatarMoeda(receitaTotal)}</strong>
            </div>
            <div className="meta-item">
              <span>Faltam</span>
              <strong>{formatarMoeda(faltamMeta)}</strong>
            </div>
            <div className="meta-item">
              <span>Progresso</span>
              <strong>{percentualMeta.toFixed(1)}%</strong>
            </div>
          </div>
          */}

        </div>

        <div className="dashboard-box">

          <h3>📊 Faturamento</h3>

          <div className="dashboard-chart">

            {serieFaturamento && serieFaturamento.length > 1 ? (

              <Line
                data={{
                  labels: serieFaturamento.map(
                    (item: { data: string }) =>
                      new Date(item.data + 'T00:00:00')
                        .toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit'
                        })
                  ),

                  datasets: [
                    {
                      label: 'Receita',

                      data: serieFaturamento.map(
                        (item: { valor: number }) => item.valor
                      ),

                      borderColor: '#c57f5f',
                      backgroundColor: 'rgba(197, 127, 95, 0.15)',

                      fill: true,
                      tension: 0.35,

                      pointRadius: 3,
                      pointBackgroundColor: '#c57f5f'
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
                  },

                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }}
              />

            ) : (

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

            )}

          </div>

        </div>

      </div>

      <div className="resumo-periodo">

        <h3 className="section-title">
          🗓️ Resumo do Período
        </h3>

        <div className="resumo-grid">

          <div className="resumo-card">

            <div className="resumo-card-info">
              <span>Atendimentos Realizados</span>
              <strong>
                {atendimentosRealizados}
              </strong>
              <small>Total no período</small>
            </div>

            <div className="resumo-card-icon">
              <FaCalendarCheck />
            </div>

          </div>

          <div className="resumo-card">

            <div className="resumo-card-info">
              <span>Novos Clientes</span>
              <strong>
                {indicadoresClientes?.novosClientes ?? 0}
              </strong>
              <small>Total no período</small>
            </div>

            <div className="resumo-card-icon">
              <FaUserPlus />
            </div>

          </div>

          <div className="resumo-card">

            <div className="resumo-card-info">
              <span>Ticket Médio</span>
              <strong>
                {formatarMoeda(ticketMedio)}
              </strong>
              <small>Valor médio por atendimento</small>
            </div>

            <div className="resumo-card-icon">
              <FaTag />
            </div>

          </div>

          <div className="resumo-card">

            <div className="resumo-card-info">
              <span>Taxa de Retorno</span>
              <strong>
                {indicadoresClientes?.taxaRetorno ?? 0}%
              </strong>
              <small>Clientes que retornaram</small>
            </div>

            <div className="resumo-card-icon">
              <FaArrowRotateLeft />
            </div>

          </div>

        </div>

      </div>

    </div>
  )
}
