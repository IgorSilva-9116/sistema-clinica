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
  baixarCSV
} from '../utils/relatorios'  

function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
}

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
        onClick={exportarFinanceiro}
        style={{
         marginBottom: 20
        }}
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

      <h3
        style={{
          marginTop: 30
        }}
      >
        🏷️ Despesas por Categoria
      </h3>

      <div
        style={{
          background: '#fff',
          padding: 20,
          borderRadius: 8,
          marginTop: 10
        }}
      >

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fill,minmax(220px,1fr))',
            gap: 15
          }}
        >

          <div
            style={{
              background: '#1976d2',
              color: '#fff',
              borderRadius: 10,
              padding: 18
            }}
          >
            <div>
              📊 Total das Categorias
            </div>

            <div
              style={{
                fontSize: 24,
                fontWeight: 'bold'
              }}
            >
              {formatarMoeda(
                totalCategorias
              )}
            </div>

          </div>

          {despesasCategoria.map(
            (item: any) => (

              <div
                key={item.Categoria}
                style={{
                  background: '#fff',
                  border:
                    '1px solid #e5e7eb',
                  borderRadius: 10,
                  padding: 18,
                  boxShadow:
                    '0 1px 3px rgba(0,0,0,.1)'
                }}
              >

                <div
                  style={{
                    fontWeight: 'bold',
                    marginBottom: 10
                  }}
                >
                  🏷️ {item.Categoria}
                </div>

                <div
                  style={{
                    color: '#1976d2',
                    fontSize: 22,
                    fontWeight: 'bold'
                  }}
                >
                  {formatarMoeda(
                    Number(item.Total)
                  )}
                </div>

              </div>

            )
          )}

        </div>

      </div>

      <h3
        style={{
          marginTop: 30
        }}
      >
        🥧 Participação por Categoria
      </h3>

      <div
        className="grafico-container"
        style={{
         width: 320,
         height: 320,
         margin: '0 auto'
        }}
      >

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