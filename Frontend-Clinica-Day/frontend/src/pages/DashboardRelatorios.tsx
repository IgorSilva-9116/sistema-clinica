import { useRelatorios } from '../hooks/useRelatorios'

function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
}

export default function DashboardRelatorios() {
  const {
    resumo,
    comparacao,
    metaMensal,
    despesasResumo
  } = useRelatorios()

  const receitaTotal =
    resumo
      ? resumo.faturamento + resumo.totalMultas
      : 0

  const lucroLiquido =
    resumo
      ? resumo.faturamento +
        resumo.totalMultas -
        despesasResumo.totalDespesasPagas
      : 0

  return (
    <div>

      <h2>📊 Indicadores Principais</h2>

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

          <p>
            Meta:
            {' '}
            {formatarMoeda(metaMensal)}
          </p>

        </div>

        <div className="dashboard-box">

          <h3>📊 Faturamento</h3>

          <p>
            Receita Atual:
            {' '}
            {formatarMoeda(receitaTotal)}
          </p>

        </div>

      </div>

    </div>
  )
}