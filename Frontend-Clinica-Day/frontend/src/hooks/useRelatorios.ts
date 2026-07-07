import { useState } from 'react'
import { api } from '../services/api'

export type Resumo = {
  totalAtendimentos: number
  diasComAtendimento: number
  horasTrabalhadas: number
  faturamento: number
  totalMultas: number
}

export type FaturamentoServico = {
  Servico: string
  TotalExecucoes: number
  TotalFaturado: number
}

export function useRelatorios() {
  const [loading, setLoading] = useState(false)

  const [resumo, setResumo] =
    useState<Resumo | null>(null)

  const [faturamentoServico, setFaturamentoServico] =
    useState<FaturamentoServico[]>([])

  const [metaMensal, setMetaMensal] =
    useState(() => {
      const salva =
        localStorage.getItem('metaMensal')

      return salva
        ? Number(salva)
        : 0
    })

  const [comparacao, setComparacao] =
    useState({
      faturamentoAtual: 0,
      faturamentoAnterior: 0,
      crescimento: 0
    })

  const [despesasResumo, setDespesasResumo] =
    useState({
      totalDespesasPagas: 0,
      totalDespesasPendentes: 0
    })

  const [despesasCategoria,
    setDespesasCategoria] = useState<any[]>([])

  const [mesFechado, setMesFechado] =
    useState(false)

  async function gerarRelatorio(
    dataInicio: string,
    dataFim: string
  ) {

    if (!dataInicio || !dataFim) {
      return
    }

    setLoading(true)

    try {

      const resumoResp =
        await api.get(
          '/relatorios/resumo',
          {
            params: {
              dataInicio,
              dataFim
            }
          }
        )

      const faturamentoResp =
        await api.get(
          '/relatorios/faturamento-servico',
          {
            params: {
              dataInicio,
              dataFim
            }
          }
        )

      const despesasResp =
        await api.get(
          '/relatorios/despesas',
          {
            params: {
              dataInicio,
              dataFim
            }
          }
        )

      const despesasCategoriaResp =
        await api.get(
          '/relatorios/despesas-categoria',
          {
            params: {
              dataInicio,
              dataFim
            }
          }
        )

      const comparacaoResp =
        await api.get(
          '/relatorios/comparacao',
          {
            params: {
              dataInicio,
              dataFim
            }
          }
        )

      const statusResp =
        await api.get(
          '/relatorios/status-mes',
          {
            params: {
              dataInicio,
              dataFim
            }
          }
        )

      setMesFechado(
        statusResp.data.fechado
      )

      const r = resumoResp.data

      setResumo({
        totalAtendimentos:
          r.totalAtendimentos ?? 0,

        diasComAtendimento:
          r.diasComAtendimento ?? 0,

        horasTrabalhadas:
          r.horasTrabalhadas ?? 0,

        faturamento:
          r.faturamento ?? 0,

        totalMultas:
          r.totalMultas ?? 0
      })

      setComparacao(
        comparacaoResp.data
      )

      const despesasData =
        despesasResp.data

      setDespesasResumo({
        totalDespesasPagas:
          despesasData
            ?.totalDespesasPagas ?? 0,

        totalDespesasPendentes:
          despesasData
            ?.totalDespesasPendentes ?? 0
      })

      setDespesasCategoria(
        despesasCategoriaResp.data || []
      )

      setFaturamentoServico(
        faturamentoResp.data.map(
          (item: any) => ({
            Servico: item.Servico,
            TotalExecucoes:
              item.TotalExecucoes ?? 0,
            TotalFaturado:
              item.TotalFaturado ?? 0
          })
        )
      )

    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    resumo,
    comparacao,
    metaMensal,
    despesasResumo,
    despesasCategoria,
    faturamentoServico,
    mesFechado,

    setMetaMensal,

    gerarRelatorio
  }
}