import { useCallback, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import type { RelatoriosOutletContext } from './Relatorios'

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

import {
  gerarCSV,
  baixarCSV,
  formatarMoeda
} from '../utils/relatorios'


ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
)

export default function ServicosRelatorios() {

  const {
    faturamentoServico
  } = useRelatoriosContext()

  function exportarServicos() {

    const csv = gerarCSV(
      faturamentoServico.map(
        (item: any) => ({
          Servico: item.Servico,
          Execucoes: item.TotalExecucoes,
          TotalFaturado: item.TotalFaturado
        })
      )
    )

    baixarCSV(
      csv,
      'servicos.csv'
    )
  }

  const { setExportAction } =
    useOutletContext<RelatoriosOutletContext>()

  const exportarServicosCallback =
    useCallback(exportarServicos, [faturamentoServico])

  useEffect(() => {

    setExportAction({
      label: 'Exportar Serviços',
      onClick: exportarServicosCallback
    })

    return () => setExportAction(null)

  }, [exportarServicosCallback, setExportAction])

  return (
    <div>

      <h2 className="section-title">🧴 Serviços</h2>

      <h3 className="section-title">Faturamento por Serviço</h3>

      {faturamentoServico.length === 0 ? (

        <div className="empty-state">
          <span className="empty-icon">🧴</span>
          <p>Nenhum serviço encontrado neste período.</p>
        </div>

      ) : (

        <table
          className="tabela-servicos"
          style={{ marginTop: 10 }}
        >
          <thead>
            <tr>
              <th>Serviço</th>
              <th>Execuções</th>
              <th>Total Faturado</th>
            </tr>
          </thead>

          <tbody>

            {faturamentoServico.map(
              (item: any, index: number) => (

                <tr key={index}>

                  <td>{item.Servico}</td>

                  <td>
                    {item.TotalExecucoes}
                  </td>

                  <td>
                    {formatarMoeda(
                      item.TotalFaturado
                    )}
                  </td>

                </tr>

              )
            )}

          </tbody>

        </table>

      )}

      <h3 className="section-title">
        📊 Faturamento por Serviço
      </h3>

      <div className="servicos-chart-box">

        {faturamentoServico.length > 0 ? (

          <div
            className="servicos-chart"
            style={{
              height: Math.max(
                faturamentoServico.length * 54,
                180
              )
            }}
          >

            <Bar
              data={{
                labels:
                  [...faturamentoServico]
                    .sort(
                      (a: any, b: any) =>
                        b.TotalFaturado - a.TotalFaturado
                    )
                    .map(
                      (f: any) => f.Servico
                    ),

                datasets: [
                  {
                    label: 'Faturamento por Serviço',

                    data:
                      [...faturamentoServico]
                        .sort(
                          (a: any, b: any) =>
                            b.TotalFaturado - a.TotalFaturado
                        )
                        .map(
                          (f: any) => f.TotalFaturado
                        ),

                    backgroundColor: '#c57f5f',
                    hoverBackgroundColor: '#b66f4d',

                    borderRadius: 8,
                    barThickness: 22
                  }
                ]
              }}
              options={{
                indexAxis: 'y',

                responsive: true,
                maintainAspectRatio: false,

                plugins: {
                  legend: {
                    display: false
                  }
                },

                scales: {
                  x: {
                    beginAtZero: true,
                    grid: {
                      color: '#f1ece5'
                    }
                  },
                  y: {
                    grid: {
                      display: false
                    }
                  }
                }
              }}
            />

          </div>

        ) : (

          <div className="empty-state">
            <span className="empty-icon">📊</span>
            <p>Nenhum dado encontrado.</p>
          </div>

        )}

      </div>

    </div>
  )
}
