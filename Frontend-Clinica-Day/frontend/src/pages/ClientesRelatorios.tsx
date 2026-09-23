import { useCallback, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import type { RelatoriosOutletContext } from './Relatorios'
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

const MEDALHAS = ['🥇', '🥈', '🥉']

export default function ClientesRelatorios() {

  const [clientes, setClientes] =
    useState<ClienteRelatorio[]>([])

  const [loading, setLoading] =
    useState(false)

  const [carregou, setCarregou] =
    useState(false)

  async function carregarClientes() {
    try {

      setLoading(true)

      const dataInicio =
        sessionStorage.getItem(
          'relatorioDataInicio'
        )

      const dataFim =
        sessionStorage.getItem(
          'relatorioDataFim'
        )

      if (!dataInicio || !dataFim) {

        alert(
          'Selecione um período e clique em Gerar Relatório.'
        )

        return
      }

      const resp =
        await api.get(
          '/relatorios/clientes',
          {
            params: {
              dataInicio,
              dataFim
            }
          }
        )

      setClientes(resp.data)
      setCarregou(true)

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

  const { setExportAction } =
    useOutletContext<RelatoriosOutletContext>()

  const exportarClientesCallback =
    useCallback(exportarClientes, [clientes])

  useEffect(() => {

    setExportAction({
      label: 'Exportar Clientes',
      onClick: exportarClientesCallback,
      disabled: clientes.length === 0
    })

    return () => setExportAction(null)

  }, [exportarClientesCallback, clientes.length, setExportAction])

  return (
    <div>

      <h2 className="section-title">👥 Clientes</h2>

      <div className="page-actions">

        <button
          onClick={carregarClientes}
        >
          {
            loading
              ? 'Carregando...'
              : 'Carregar Clientes'
          }
        </button>

      </div>

      {!carregou && !loading && (

        <div className="empty-state">
          <span className="empty-icon">👥</span>
          <p>
            Selecione um período em Relatórios e clique em
            "Carregar Clientes" para ver o ranking.
          </p>
        </div>

      )}

      {carregou && clientes.length === 0 && (

        <div className="empty-state">
          <span className="empty-icon">👥</span>
          <p>Nenhum cliente encontrado neste período.</p>
        </div>

      )}

      {clientes.length > 0 && (

        <table
          className="tabela-clientes"
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

                  <td className="rank-medalha">
                    {MEDALHAS[index] ?? index + 1}
                  </td>

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
