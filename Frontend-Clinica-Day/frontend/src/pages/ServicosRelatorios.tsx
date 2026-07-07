export default function ServicosRelatorios() {
  return (
    <div>

      <h2>🧴 Serviços</h2>

      <h3>Faturamento por Serviço</h3>

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
          <tr>
            <td>Em migração</td>
            <td>0</td>
            <td>R$ 0,00</td>
          </tr>
        </tbody>

      </table>

      <h3>📊 Faturamento por Serviço</h3>

      <div className="grafico-container">
        Gráfico em migração...
      </div>

    </div>
  )
}