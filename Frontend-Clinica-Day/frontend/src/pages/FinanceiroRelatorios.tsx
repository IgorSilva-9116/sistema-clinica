import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'

import { Pie } from 'react-chartjs-2'

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

export default function FinanceiroRelatorios() {

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

  return (
    <div>

      <h2>💰 Financeiro</h2>

      <button
        className="export-button"
        onClick={exportarFinanceiro}
      >
       📥 Exportar Financeiro
      </button>

      <h3>Resultado Financeiro</h3>

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

      </div>

      <h3 className="financeiro-section">
        🏷️ Despesas por Categoria
      </h3>

       <div className="financeiro-box">

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

</div>

      <h3 className="financeiro-section">
        🥧 Participação por Categoria
      </h3>

      <div className="financeiro-pizza">

  {despesasCategoria.length > 1 ? (

   <Pie
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

        backgroundColor: [
          '#1976D2',
          '#43A047',
          '#FB8C00',
          '#8E24AA',
          '#E53935',
          '#00897B'
        ],

        borderColor: '#fff',
        borderWidth: 2
      }
    ]
  }}
  options={{
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  }}
/>

  ) : (

    <p>
      Cadastre despesas em mais categorias
      para visualizar o gráfico.
    </p>

  )}

</div>

    </div>
  )
}