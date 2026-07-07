export default function FinanceiroRelatorios() {
  return (
    <div>

      <h2>💰 Financeiro</h2>

      <h3>Resultado Financeiro</h3>

      <div className="grafico-container">
        Gráfico Resultado Financeiro em migração...
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
              R$ 0,00
            </div>
          </div>

        </div>

      </div>

      <h3
        style={{
          marginTop: 30
        }}
      >
        🥧 Participação por Categoria
      </h3>

      <div className="grafico-container">
        Gráfico Pizza em migração...
      </div>

    </div>
  )
}