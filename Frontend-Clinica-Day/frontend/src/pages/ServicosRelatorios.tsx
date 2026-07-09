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

  return (
    <div>

      <h2>🧴 Serviços</h2>

      <button
        className="export-button"
        onClick={exportarServicos}
      >
       📥 Exportar Serviços
      </button>

      <h3>Faturamento por Serviço</h3>

      {faturamentoServico.length === 0 ? (

        <p>
          Nenhum serviço encontrado.
        </p>

      ) : (

        <table
          border={1}
          cellPadding={6}
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

      <h3>
        📊 Faturamento por Serviço
      </h3>

      <div className="servicos-chart">

        {faturamentoServico.length > 0 ? (

          <Bar
            data={{
              labels:
                faturamentoServico.map(
                  (f: any) =>
                    f.Servico
                ),

              datasets: [
               {
                 label: 'Faturamento por Serviço',

                 data:
                   faturamentoServico.map(
                    (f: any) =>
                    f.TotalFaturado
                  ),

                 backgroundColor: [
                  '#1976D2',
                  '#43A047',
                  '#FB8C00',
                  '#8E24AA',
                  '#E53935'
                 ],

                 borderRadius: 10,
                 borderWidth: 1
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

        ) : (

          <p>
            Nenhum dado encontrado
          </p>

        )}

      </div>

    </div>
  )
}