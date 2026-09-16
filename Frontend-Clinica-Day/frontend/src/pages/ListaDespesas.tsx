import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { api } from '../services/api'
import { listarDespesas, excluirDespesa } from '../services/DespesaService'

import type { Despesa } from '../types/Despesa'

// import '../styles/listaDespesas.css'

export default function ListaDespesas() {

    const navigate = useNavigate()

    const [despesas, setDespesas] =
        useState<Despesa[]>([])

    const [dataInicio, setDataInicio] =
        useState('')

    const [dataFim, setDataFim] =
        useState('')

    useEffect(() => {

        const hoje = new Date()

        const primeiroDia =
            new Date(
                hoje.getFullYear(),
                hoje.getMonth(),
                1
            )

        setDataInicio(
            primeiroDia.toISOString().split('T')[0]
        )

        setDataFim(
            hoje.toISOString().split('T')[0]
        )

    }, [])

    useEffect(() => {

        if (dataInicio && dataFim) {
            carregar()
        }

    }, [dataInicio, dataFim])

    async function carregar() {

        try {

            if (!dataInicio || !dataFim) {
                setDespesas([])
                return
            }

            const dados =
                await listarDespesas(
                    dataInicio,
                    dataFim
                )

            setDespesas(dados)

        } catch (err) {

            console.error(
                'Erro ao carregar despesas',
                err
            )

        }
    }

    async function filtrar() {
        await carregar()
    }

    async function remover(id: number) {

        try {

            await excluirDespesa(id)

            await carregar()

        } catch (err) {

            console.error(err)

        }
    }

    async function marcarPago(id: number) {

        try {

            await api.patch(
                `/despesas/${id}/pagar`
            )

            await carregar()

        } catch (err) {

            console.error(err)

        }
    }

    function formatarData(dataIso: string) {

        return dataIso
            .substring(0, 10)
            .split('-')
            .reverse()
            .join('/')

    }

    function formatarMoedaLista(
        valor: number
    ) {

        return valor.toLocaleString(
            'pt-BR',
            {
                style: 'currency',
                currency: 'BRL'
            }
        )

    }

    return (
        <div className="despesas-container">

            <div className="config-header">

                <div>

                    <h1>Lista de Despesas</h1>

                    <p className="despesas-subtitulo">
                        Consulte e gerencie as despesas da clínica.
                    </p>

                </div>

                <div className="header-acoes">

                    <button
                        className="btn-secundario"
                        onClick={() =>
                            navigate('/despesas')
                        }
                    >
                        Nova Despesa
                    </button>

                    <button
                        className="btn-voltar-agenda"
                        onClick={() =>
                            navigate(-1)
                        }
                    >
                        Voltar
                    </button>

                </div>

            </div>

            <div className="despesas-card">

                <h3 className="card-titulo">
                    Filtro por período
                </h3>

                <div className="despesas-filtro-linha">

                    <input
                        type="date"
                        value={dataInicio}
                        onChange={(e) =>
                            setDataInicio(
                                e.target.value
                            )
                        }
                    />

                    <input
                        type="date"
                        value={dataFim}
                        onChange={(e) =>
                            setDataFim(
                                e.target.value
                            )
                        }
                    />

                    <button
                        className="btn-despesa-secundario"
                        onClick={filtrar}
                    >
                        Filtrar
                    </button>

                </div>

            </div>

            <div className="lista-despesas">

                <h3 className="lista-despesas-titulo">
                    Lista de Despesas
                </h3>

                {despesas.length === 0 && (

                    <div className="lista-vazia">

                        Nenhuma despesa encontrada.

                    </div>

                )}

                {despesas.map((d) => (

                    <div
                        key={d.Id}
                        className="despesa-item"
                    >

                        <div className="despesa-topo">

                            <strong className="despesa-titulo">
                                {d.Descricao}
                            </strong>

                            <span
                                className={
                                    d.Status === 'PAGO'
                                        ? 'status-pago'
                                        : 'status-pendente'
                                }
                            >
                                {d.Status}
                            </span>

                        </div>

                        <div className="despesa-valor">
                            {formatarMoedaLista(
                                Number(d.Valor)
                            )}
                        </div>

                        <div className="despesa-info">
                            Data: {formatarData(d.Data)}
                        </div>

                        <div className="despesa-info">
                            Categoria: {d.CategoriaFinanceira || '-'}
                        </div>

                        <div className="despesa-info">
                            Forma: {d.FormaPagamento || '-'}
                        </div>

                        <div className="despesa-acoes">

                            {d.Status === 'PENDENTE' && (

                                <button
                                    className="btn-pago"
                                    onClick={() =>
                                        marcarPago(d.Id)
                                    }
                                >
                                    Marcar como Pago
                                </button>

                            )}

                            <button
                                className="btn-editar"
                                onClick={() =>
                                    navigate(`/despesas?editar=${d.Id}`)
                                }
                            >
                                Editar
                            </button>

                            <button
                                className="btn-excluir"
                                onClick={() =>
                                    remover(d.Id)
                                }
                            >
                                Excluir
                            </button>

                        </div>

                    </div>

                ))}

            </div>

        </div>
    )
}