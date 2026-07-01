import { useEffect, useState } from 'react'
import type { Despesa } from '../types/Despesa'

import { listarDespesas, criarDespesa, excluirDespesa } from '../services/DespesaService'
import { api } from '../services/api'

export default function DespesaPage() {
  const [despesas, setDespesas] = useState<Despesa[]>([])

  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [data, setData] = useState('')

  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [formaPagamento, setFormaPagamento] = useState('')
  const [status, setStatus] = useState('PENDENTE')
  const [valorTexto, setValorTexto] = useState('')

  // ✅ ✅ CORREÇÃO DEFINITIVA
  async function carregar() {
    try {
      if (!dataInicio || !dataFim) {
        setDespesas([])
        return
      }

      const dados = await listarDespesas(dataInicio, dataFim)

      // ✅ AGORA dados já é um array
      setDespesas(dados)

    } catch (err) {
      console.error('Erro ao carregar despesas', err)
    }
  }

  async function filtrar() {
    if (!dataInicio || !dataFim) {
      alert('Selecione o período')
      return
    }

    await carregar()
  }

  async function salvar() {
    if (!descricao || !valor || !data) {
      alert('Preencha todos os campos')
      return
    }

    try {
      await criarDespesa({
        Descricao: descricao,
        Valor: Number(valor.replace(',', '.')),
        Data: data,
        FormaPagamento: formaPagamento,
        Status: status
      })

      setDescricao('')
      setValor('')
      setValorTexto('')
      setData('')
      setFormaPagamento('')
      setStatus('PENDENTE')

      await carregar()

    } catch (err) {
      console.error('Erro ao salvar despesa', err)
      alert('Erro ao salvar despesa')
    }
  }

  async function remover(id: number) {
    try {
      await excluirDespesa(id)
      await carregar()
    } catch (err) {
      console.error('Erro ao excluir despesa', err)
      alert('Erro ao excluir despesa')
    }
  }

  async function marcarPago(id: number) {
    try {
      await api.patch(`/despesas/${id}/pagar`)
      await carregar()
    } catch (err) {
      console.error('Erro ao marcar como pago', err)
      alert('Erro ao atualizar status')
    }
  }

  useEffect(() => {
    // opcional: pode deixar vazio mesmo
  }, [])

  function formatarData(dataIso: string) {
    const data = new Date(dataIso)
    return data.toLocaleDateString('pt-BR')
  }

  function formatarMoedaLista(valor: number) {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  function formatarMoeda(valor: string) {
    const apenasNumeros = valor.replace(/\D/g, '')
    const numero = Number(apenasNumeros) / 100

    return numero.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 20 }}>
      <h1 style={{ marginBottom: 20 }}>💰 Despesas</h1>

      {/* FILTRO */}
      <div style={{ marginBottom: 20, padding: 15, border: '1px solid #ddd', borderRadius: 8 }}>
        <h3>📅 Filtro por período</h3>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
          <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
          <button onClick={filtrar}>Filtrar</button>
        </div>
      </div>

      {/* FORMULÁRIO */}
      <div style={{ marginBottom: 20, padding: 15, border: '1px solid #ddd', borderRadius: 8 }}>
        <h3>➕ Nova despesa</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            placeholder="Descrição"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />

          <input
            placeholder="Valor"
            value={valorTexto}
            onChange={(e) => {
              const texto = e.target.value
              const apenasNumeros = texto.replace(/\D/g, '')
              const numero = Number(apenasNumeros) / 100

              setValorTexto(formatarMoeda(texto))
              setValor(numero.toString())
            }}
          />

          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
          />

          <select
            value={formaPagamento}
            onChange={(e) => setFormaPagamento(e.target.value)}
          >
            <option value="">Forma de pagamento</option>
            <option value="PIX">PIX</option>
            <option value="DINHEIRO">Dinheiro</option>
            <option value="DEBITO">Cartão Débito</option>
            <option value="CREDITO">Cartão Crédito</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="PENDENTE">Pendente</option>
            <option value="PAGO">Pago</option>
          </select>

          <button onClick={salvar} style={{ marginTop: 10 }}>
            Salvar
          </button>
        </div>
      </div>

      {/* LISTA */}
      <div>
        <h3>📋 Lista de Despesas</h3>

        {despesas.length === 0 && <p>Nenhuma despesa cadastrada</p>}

        {despesas.map((d) => (
          <div
            key={d.Id}
            style={{
              marginBottom: 15,
              padding: 15,
              border: '1px solid #ddd',
              borderRadius: 8,
              background: '#fafafa'
            }}
          >
            <strong style={{ fontSize: 16 }}>{d.Descricao}</strong>

            <p style={{ marginTop: 5 }}>
              💵 {formatarMoedaLista(Number(d.Valor))}
            </p>

            <p>📅 {formatarData(d.Data)}</p>

            <p>💳 Forma: {d.FormaPagamento || '-'}</p>

            <p>
              Status:{' '}
              {d.Status === 'PAGO'
                ? '🟢 Pago'
                : '🔴 Pendente'}
            </p>

            {d.Status === 'PENDENTE' && (
              <button onClick={() => marcarPago(d.Id)}>
                ✔ Marcar como pago
              </button>
            )}

            <br />

            <button onClick={() => remover(d.Id)} style={{ marginTop: 5 }}>
              ❌ Excluir
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}