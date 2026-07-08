import { useState } from 'react'
import { api } from '../services/api'

import {
  gerarCSV,
  baixarCSV
} from '../utils/relatorios'

type ClienteRelatorio = {
  clienteId: number
  cliente: string
  totalProcedimentos: number
  valorGasto: number
  frequenciaMedia: number
}

function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
}

export default function ClientesRelatorios() {

  const [clientes, setClientes] =
    useState<ClienteRelatorio[]>([])

  const [loading, setLoading] =
    useState(false)

  async function carregarClientes() {
    try {

      setLoading(true)

      const resp =
        await api.get(
          '/relatorios/clientes',
          {
            params: {
              dataInicio: '2026-05-01',
              dataFim: '2026-07-08'
            }
          }
        )

      setClientes(resp.data)

    } catch (err) {

      console.error(err)

      alert(
        'Erro ao carregar clientes'
      )

    } finally {

      setLoading(false)

    }
  }

  function exportarClientes() {

  const csv = gerarCSV(
    clientes.map(
      cliente => ({
        Cliente: cliente.cliente,
        Procedimentos:
          cliente.totalProcedimentos,
        ValorGasto:
          cliente.valorGasto,
        Frequencia:
          cliente.frequenciaMedia
      })
    )
  )

  baixarCSV(
    csv,
    'clientes.csv'
  )
}

  return (
    <div>

      <h2>👥 Clientes</h2>

      <button
        onClick={exportarClientes}
        style={{
         marginRight: 10,
         marginBottom: 20
        }}
      >
       📥 Exportar Clientes
      </button>

      <button
        onClick={carregarClientes}
      >
        {
          loading
            ? 'Carregando...'
            : 'Carregar Clientes'
        }
      </button>

      {clientes.length > 0 && (

        <table
          border={1}
          cellPadding={6}
          style={{ marginTop: 20 }}
        >

          <thead>
            <tr>
              <th>Rank</th>
              <th>Cliente</th>
              <th>Procedimentos</th>
              <th>Valor Gasto</th>
              <th>Frequência</th>
            </tr>
          </thead>

          <tbody>

            {clientes.map(
              (c, index) => (

                <tr
                  key={c.clienteId}
                >

                  <td>{index + 1}</td>

                  <td>{c.cliente}</td>

                  <td>{c.totalProcedimentos}</td>

                  <td>
                    {formatarMoeda(
                      c.valorGasto
                    )}
                  </td>

                  <td>{c.frequenciaMedia}</td>

                </tr>

              )
            )}

          </tbody>

        </table>

      )}

    </div>
  )
}