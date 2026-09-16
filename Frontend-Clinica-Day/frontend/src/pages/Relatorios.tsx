import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import '../styles/relatorios.css'

import {
  RelatoriosProvider,
  useRelatoriosContext
} from '../contexts/RelatoriosContext'


function RelatoriosContent() {
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  const {
    gerarRelatorio,
    mesFechado,
    fechamentos,
    fecharMes,
    reabrirMes
  } = useRelatoriosContext()

  return (
    <div className="container">

      <div className="relatorios-header">

        <div>

          <h1>Relatórios</h1>

          <p className="relatorios-subtitulo">
            Acompanhe indicadores e desempenho da clínica.
          </p>

        </div>

        <div className="filtros">

          <input
            type="date"
            value={dataInicio}
            onChange={(e) =>
              setDataInicio(e.target.value)
            }
          />

          <input
            type="date"
            value={dataFim}
            onChange={(e) =>
              setDataFim(e.target.value)
            }
          />

          <button
            onClick={() => {

              sessionStorage.setItem(
                'relatorioDataInicio',
                dataInicio
              )

              sessionStorage.setItem(
                'relatorioDataFim',
                dataFim
              )

              gerarRelatorio(
                dataInicio,
                dataFim
              )

            }}
          >
            Gerar Relatório
          </button>

        </div>

      </div>

      <nav className="relatorio-nav">

        <NavLink to="">
          Dashboard
        </NavLink>

        <NavLink to="financeiro">
          Financeiro
        </NavLink>

        <NavLink to="clientes">
          Clientes
        </NavLink>

        <NavLink to="servicos">
          Serviços
        </NavLink>

      </nav>

      <div className="periodo-toolbar">

        {mesFechado ? (

          <div className="periodo-fechado">
            ● PERÍODO FECHADO
          </div>

        ) : (

          <div className="periodo-aberto">
            ● PERÍODO ABERTO
          </div>

        )}

        {
          !mesFechado &&
          dataInicio &&
          dataFim && (

            <button
              className="btn-fechar-mes"
              onClick={() =>
                fecharMes(
                  dataInicio,
                  dataFim
                )
              }
            >
              Fechar Mês
            </button>

          )
        }

      </div>

      {
        fechamentos.length > 0 && (

          <div
            style={{
              marginTop: 20,
              marginBottom: 25
            }}
          >

            <h3 className="historico-titulo">
              Histórico de Fechamentos
            </h3>

            {fechamentos.map(
              (f: any) => (

                <div
                  key={f.Id}
                  className="historico-fechamento"
                >

                  <strong>
                    🔒 Período
                  </strong>

                  <br />

                  {new Date(
                    f.DataInicio
                  ).toLocaleDateString('pt-BR')}

                  {' até '}

                  {new Date(
                    f.DataFim
                  ).toLocaleDateString('pt-BR')}

                  <br />

                  <small>

                    Fechado em:

                    {' '}

                    {new Date(
                      f.CriadoEm
                    ).toLocaleString('pt-BR')}

                  </small>

                  <br />
                  <br />
                  <button
                    onClick={() => {

                      const confirmar =
                        window.confirm(
                          'Deseja realmente reabrir este período?'
                        )

                      if (!confirmar) return

                      reabrirMes(f.Id)

                    }}
                  >
                    🔓 Reabrir
                  </button>

                </div>

              )
            )}

          </div>

        )
      }

      <Outlet />

    </div>
  )
}

export default function Relatorios() {
  return (
    <RelatoriosProvider>

      <RelatoriosContent />

    </RelatoriosProvider>
  )
}