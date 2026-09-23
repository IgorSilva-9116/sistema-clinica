import { useCallback, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import type { RelatoriosOutletContext } from './Relatorios'

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'

import { Doughnut } from 'react-chartjs-2'

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
)

import { useRelatoriosContext }
  from '../contexts/RelatoriosContext'

import {
  gerarCSV,
  baixarCSV,
  formatarMoeda
} from '../utils/relatorios'

import {
  FaSackDollar,
  FaArrowTrendDown,
  FaArrowTrendUp
} from 'react-icons/fa6'

export default function FinanceiroRelatorios() {

  const CORES_CATEGORIA = [
    '#c57f5f',
    '#e3a97a',
    '#8c5a3c',
    '#efc9a4',
    '#a9714f',
    '#d98a5f'
  ]

  const {
    resumo,
    despesasResumo,
    despesasCategoria
  } = useRelatoriosContext()

  const lucroLiquido =
    resumo
      ? resumo.faturamento +
      resumo.totalMultas -
      despesasResumo.totalDespesasPagas
      : 0

  const receitaTotal =
    resumo
      ? resumo.faturamento +
      resumo.totalMultas
      : 0

  const margemLucro =
    receitaTotal > 0
      ? (lucroLiquido / receitaTotal) * 100
      : 0

  const totalCategorias =
    despesasCategoria.reduce(
      (
        total: number,
        item: any
      ) =>
        total + Number(item.Total),
      0
    )

  function exportarFinanceiro() {

    const csv = gerarCSV(

      despesasCategoria.map(
        (item: any) => ({
          Categoria:
            item.Categoria,

          Total:
            Number(item.Total)
        })
      )

    )

    baixarCSV(
      csv,
      'financeiro-categorias.csv'
    )
  }

  const { setExportAction } =
    useOutletContext<RelatoriosOutletContext>()

  const exportarFinanceiroCallback =
    useCallback(exportarFinanceiro, [despesasCategoria])

  useEffect(() => {

    setExportAction({
      label: 'Exportar Financeiro',
      onClick: exportarFinanceiroCallback
    })

    return () => setExportAction(null)

  }, [exportarFinanceiroCallback, setExportAction])

  return (
    <div>

      <h2 className="section-title">💰 Financeiro</h2>

      <h3 className="section-title">Resultado Financeiro</h3>

      <div className="cards cards-3">

        <div className="card receita">

          <div className="card-icon">
            <FaSackDollar />
          </div>

          <div className="card-content">
            <span>Receita</span>

            <strong>
              {formatarMoeda(receitaTotal)}
            </strong>

            <small>Faturamento + multas</small>

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

            <small>Total de despesas pagas</small>

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

      </div>

      <h3 className="financeiro-section">
        🏷️ Despesas por Categoria
      </h3>

      <div className="financeiro-box">

        {despesasCategoria.length === 0 ? (

          <div className="empty-state">
            <span className="empty-icon">🏷️</span>
            <p>Nenhuma despesa cadastrada neste período.</p>
          </div>

        ) : (

          <div className="financeiro-grid">

            <div className="financeiro-total-card">

              <div>
                📊 Total das Categorias
              </div>

              <div className="financeiro-total-value">
                {formatarMoeda(totalCategorias)}
              </div>

            </div>

            {despesasCategoria.map(
              (item: any) => (

                <div
                  key={item.Categoria}
                  className="financeiro-categoria-card"
                >

                  <div className="financeiro-categoria-titulo">
                    🏷️ {item.Categoria}
                  </div>

                  <div className="financeiro-categoria-valor">
                    {formatarMoeda(
                      Number(item.Total)
                    )}
                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>

      <h3 className="financeiro-section">
        🥧 Participação por Categoria
      </h3>

      <div className="financeiro-box">

        {despesasCategoria.length > 1 ? (

          <div className="financeiro-pizza-row">

            <div className="financeiro-donut-wrap">

              <Doughnut
                data={{
                  labels:
                    despesasCategoria.map(
                      (item: any) =>
                        item.Categoria
                    ),

                  datasets: [
                    {
                      data:
                        despesasCategoria.map(
                          (item: any) =>
                            Number(item.Total)
                        ),

                      backgroundColor:
                        despesasCategoria.map(
                          (_: any, index: number) =>
                            CORES_CATEGORIA[
                              index % CORES_CATEGORIA.length
                            ]
                        ),

                      borderColor: '#fffdfb',
                      borderWidth: 3,
                      hoverOffset: 6
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '70%',

                  plugins: {
                    legend: {
                      display: false
                    }
                  }
                }}
              />

              <div className="financeiro-donut-center">
                <span>Total</span>
                <strong>
                  {formatarMoeda(totalCategorias)}
                </strong>
              </div>

            </div>

            <div className="financeiro-legend">

              {despesasCategoria.map(
                (item: any, index: number) => {

                  const valor = Number(item.Total)

                  const percentual =
                    totalCategorias > 0
                      ? (valor / totalCategorias) * 100
                      : 0

                  return (

                    <div
                      key={item.Categoria}
                      className="financeiro-legend-item"
                    >

                      <div className="financeiro-legend-label">

                        <span
                          className="financeiro-legend-dot"
                          style={{
                            background:
                              CORES_CATEGORIA[
                                index % CORES_CATEGORIA.length
                              ]
                          }}
                        />

                        {item.Categoria}

                      </div>

                      <div className="financeiro-legend-valores">
                        <strong>
                          {formatarMoeda(valor)}
                        </strong>
                        <small>
                          {percentual.toFixed(1)}%
                        </small>
                      </div>

                    </div>

                  )
                }
              )}

            </div>

          </div>

        ) : (

          <div className="empty-state">
            <span className="empty-icon">🥧</span>
            <p>
              Cadastre despesas em mais categorias
              para visualizar o gráfico.
            </p>
          </div>

        )}

      </div>

    </div>
  )
}
