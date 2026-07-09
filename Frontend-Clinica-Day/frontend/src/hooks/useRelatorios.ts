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

  const [dataInicio, setDataInicio] =
  useState('')

  const [dataFim, setDataFim] =
  useState('')

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

    function atualizarMeta(valor: number) {
     setMetaMensal(valor)

    localStorage.setItem(
     'metaMensal',
     valor.toString()
    )
  }

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

  
  const [fechamentos, setFechamentos] =
    useState<any[]>([])  

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

      const fechamentosResp =
        await api.get(
          '/relatorios/fechamentos'
         )

          setMesFechado(
           statusResp.data.fechado
          )

          setFechamentos(
           fechamentosResp.data || []
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

  async function salvarMetaBackend() {
  try {

    await api.post(
      '/relatorios/meta',
      {
        valor: metaMensal
      }
    )

    alert(
      'Meta salva com sucesso!'
    )

  } catch {

    alert(
      'Erro ao salvar meta'
    )

  }
}

/**
 * =========================
 * FECHAR MÊS
 * =========================
 */
async function fecharMes(
  dataInicio: string,
  dataFim: string
) {

  try {

    await api.post(
      '/relatorios/fechar-mes',
      {
        dataInicio,
        dataFim
      }
    )

    setMesFechado(true)

    alert(
      'Período fechado com sucesso!'
    )

  } catch (err) {

    console.error(err)

    alert(
      'Erro ao fechar período'
    )

  }

}

/**
 * =========================
 * REABRIR MÊS
 * =========================
 */
async function reabrirMes(
  id: number
) {

  try {

    await api.delete(
      `/relatorios/fechamentos/${id}`
    )

    alert(
      'Período reaberto com sucesso!'
    )

  } catch (err) {

    console.error(err)

    alert(
      'Erro ao reabrir período'
    )

  }

}

  return {
    loading,
    dataInicio,
    dataFim,
    setDataInicio,
    setDataFim,
    resumo,
    comparacao,
    metaMensal,
    despesasResumo,
    despesasCategoria,
    faturamentoServico,
    mesFechado,
    fechamentos,
    fecharMes,
    reabrirMes,
    setMetaMensal,
    atualizarMeta,
    salvarMetaBackend,
    gerarRelatorio
  }
}