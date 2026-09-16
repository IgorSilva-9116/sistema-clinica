import { useEffect, useState } from 'react'

import { criarDespesa, editarDespesa, obterDespesaPorId } from '../services/DespesaService'
import { useNavigate, useSearchParams } from 'react-router-dom'
import '../styles/despesas.css'

import {
  categoriaFinanceiraService,
  type CategoriaFinanceira
} from '../services/categoriaFinanceiraService'

export default function DespesaPage() {

  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [data, setData] = useState('')
  const [formaPagamento, setFormaPagamento] = useState('')
  const [status, setStatus] = useState('PENDENTE')
  const [valorTexto, setValorTexto] = useState('')
  const [categorias, setCategorias] = useState<CategoriaFinanceira[]>([])
  const [categoriaFinanceiraId, setCategoriaFinanceiraId] = useState('')
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [mensagemSucesso, setMensagemSucesso] = useState('')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const idEditar = searchParams.get('editar')


  // ✅ ✅ CORREÇÃO DEFINITIVA



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

        CategoriaFinanceiraId:
          categoriaFinanceiraId
            ? Number(categoriaFinanceiraId)
            : null,

        FormaPagamento: formaPagamento,
        Status: status
      })

      setDescricao('')
      setValor('')
      setValorTexto('')
      setData('')
      setFormaPagamento('')
      setStatus('PENDENTE')
      setCategoriaFinanceiraId('')

      setMensagemSucesso(
        'Despesa cadastrada com sucesso!'
      )

  
      setTimeout(() => {
        setMensagemSucesso('')
      }, 3000)

    } catch (err: any) {

      console.error(
        'Erro ao salvar despesa',
        err
      )

      alert(
        err?.response?.data?.mensagem ||
        'Erro ao salvar despesa'
      )

    }

  }


  async function atualizar() {

    if (!editandoId) return

    try {

      await editarDespesa(
        editandoId,
        {
          Descricao: descricao,

          Valor: Number(
            valor.replace(',', '.')
          ),

          Data: data,

          CategoriaFinanceiraId:
            categoriaFinanceiraId
              ? Number(
                categoriaFinanceiraId
              )
              : null,

          FormaPagamento:
            formaPagamento,

          Status: status
        }
      )

      setEditandoId(null)

      setDescricao('')
      setValor('')
      setValorTexto('')
      setData('')
      setFormaPagamento('')
      setStatus('PENDENTE')
      setCategoriaFinanceiraId('')

      setMensagemSucesso(
        'Despesa atualizada com sucesso!'
      )

      setMensagemSucesso(
        'Despesa atualizada com sucesso!'
      )

      setTimeout(() => {
        navigate('/despesas/lista')
      }, 1500)

    } catch (err: any) {

      console.error(err)

      alert(
        err?.response?.data?.mensagem ||
        'Erro ao atualizar despesa'
      )

    }
  }


  async function carregarCategorias() {

    const response =
      await categoriaFinanceiraService.listar()

    const categoriasAtivas =
      (response.categorias || []).filter(
        c => c.status === 'Ativo'
      )

    setCategorias(categoriasAtivas)
  }

  async function carregarDespesa() {

    if (!idEditar) return

    try {

      const despesa =
        await obterDespesaPorId(
          Number(idEditar)
        )

      setEditandoId(
        despesa.Id
      )

      setDescricao(
        despesa.Descricao
      )

      setValor(
        Number(
          despesa.Valor
        ).toString()
      )

      setValorTexto(
        Number(
          despesa.Valor
        ).toLocaleString(
          'pt-BR',
          {
            style: 'currency',
            currency: 'BRL'
          }
        )
      )

      setData(
        despesa.Data.substring(0, 10)
      )

      setCategoriaFinanceiraId(
        despesa.CategoriaFinanceiraId
          ? String(
            despesa.CategoriaFinanceiraId
          )
          : ''
      )

      setFormaPagamento(
        despesa.FormaPagamento || ''
      )

      setStatus(
        despesa.Status || 'PENDENTE'
      )

    } catch (err) {

      console.error(
        'Erro ao carregar despesa',
        err
      )

    }

  }



  useEffect(() => {

    carregarCategorias()

    if (idEditar) {
      carregarDespesa()
    }

  }, [idEditar])


  function formatarMoeda(valor: string) {
    const apenasNumeros = valor.replace(/\D/g, '')
    const numero = Number(apenasNumeros) / 100

    return numero.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  return (
    <div className="despesas-container">

      <div className="config-header">

        <div>
          <h1>Despesas</h1>

          <p className="despesas-subtitulo">
            Gerencie os gastos e despesas da clínica.
          </p>
        </div>

        <div className="header-acoes">

          <button
            className="btn-secundario"
            onClick={() => navigate('/despesas/lista')}
          >
            Ver Despesas
          </button>

          <button
            className="btn-voltar-agenda"
            onClick={() => navigate(-1)}
          >
            Voltar
          </button>

        </div>

      </div>

      {mensagemSucesso && (
        <div className="despesa-sucesso">
          {mensagemSucesso}
        </div>
      )}

      <div className="despesas-card">

        <h3 className="card-titulo">
          Nova Despesa
        </h3>

        <p className="card-subtitulo">
          Registre um novo gasto da clínica.
        </p>

        <div className="despesas-formulario">

          <input
            placeholder="Descrição"
            value={descricao}
            onChange={(e) =>
              setDescricao(e.target.value)
            }
          />

          <input
            placeholder="Valor"
            value={valorTexto}
            onChange={(e) => {

              const texto =
                e.target.value

              const apenasNumeros =
                texto.replace(/\D/g, '')

              const numero =
                Number(apenasNumeros) / 100

              setValorTexto(
                formatarMoeda(texto)
              )

              setValor(
                numero.toString()
              )

            }}
          />

          <input
            type="date"
            value={data}
            onChange={(e) =>
              setData(e.target.value)
            }
          />

          <select
            value={categoriaFinanceiraId}
            onChange={(e) =>
              setCategoriaFinanceiraId(
                e.target.value
              )
            }
          >

            <option value="">
              Categoria Financeira
            </option>

            {categorias.map(c => (

              <option
                key={c.id}
                value={c.id}
              >
                {c.nome}
              </option>

            ))}

          </select>

          <select
            value={formaPagamento}
            onChange={(e) =>
              setFormaPagamento(
                e.target.value
              )
            }
          >

            <option value="">
              Forma de pagamento
            </option>

            <option value="PIX">
              PIX
            </option>

            <option value="DINHEIRO">
              Dinheiro
            </option>

            <option value="DEBITO">
              Cartão Débito
            </option>

            <option value="CREDITO">
              Cartão Crédito
            </option>

          </select>

          <select
            value={status}
            onChange={(e) =>
              setStatus(
                e.target.value
              )
            }
          >

            <option value="PENDENTE">
              Pendente
            </option>

            <option value="PAGO">
              Pago
            </option>

          </select>

          <button
            className="btn-salvar-despesa"
            onClick={
              editandoId
                ? atualizar
                : salvar
            }
          >
            {editandoId
              ? 'Atualizar'
              : 'Salvar'}
          </button>

        </div>

      </div>

    </div>
  )
}