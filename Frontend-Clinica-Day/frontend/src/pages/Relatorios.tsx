import { useMemo, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import '../styles/relatorios.css'

import {
  RelatoriosProvider,
  useRelatoriosContext
} from '../contexts/RelatoriosContext'

export type ExportAction = {
  label: string
  onClick: () => void
  disabled?: boolean
} | null

export type RelatoriosOutletContext = {
  setExportAction: (action: ExportAction) => void
}

function RelatoriosContent() {
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [periodoGerado, setPeriodoGerado] = useState<
    { inicio: string; fim: string } | null
  >(null)
  const [mostrarHistorico, setMostrarHistorico] = useState(false)
  const [exportAction, setExportAction] = useState<ExportAction>(null)

  const {
    gerarRelatorio,
    mesFechado,
    fechamentos,
    fecharMes,
    reabrirMes
  } = useRelatoriosContext()

  // Objeto estável passado pro Outlet — só o setter, para não
  // recriar a referência a cada render e evitar loop de efeitos
  // nos componentes filhos que o consomem.
  const outletContext = useMemo<RelatoriosOutletContext>(
    () => ({ setExportAction }),
    []
  )

  function formatarData(data: string) {
    if (!data) return ''
    return new Date(data + 'T00:00:00')
      .toLocaleDateString('pt-BR')
  }

  return (
    <div className="container">

      <div className="relatorios-header">

        <div>

          <h1>Relatórios</h1>

          <p className="relatorios-subtitulo">
            Acompanhe indicadores e desempenho da clínica.
          </p>

        </div>

        <div>

          <div className="filtros">

            <div className="filtro-campo">
              <label>Data início</label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) =>
                  setDataInicio(e.target.value)
                }
              />
            </div>

            <div className="filtro-campo">
              <label>Data fim</label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) =>
                  setDataFim(e.target.value)
                }
              />
            </div>

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

                setPeriodoGerado({
                  inicio: dataInicio,
                  fim: dataFim
                })

                gerarRelatorio(
                  dataInicio,
                  dataFim
                )

              }}
            >
              Gerar Relatório
            </button>

            {exportAction && (

              <button
                className="export-button-header"
                onClick={exportAction.onClick}
                disabled={exportAction.disabled}
              >
                📥 {exportAction.label}
              </button>

            )}

          </div>

          {periodoGerado && (

            <p className="periodo-selecionado">
              Período selecionado: {formatarData(periodoGerado.inicio)}
              {' '}até {formatarData(periodoGerado.fim)}
            </p>

          )}

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

        <div className="periodo-status-group">

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
                🔒 Fechar Mês
              </button>

            )
          }

        </div>

        {
          fechamentos.length > 0 && (

            <button
              className="btn-historico-icon"
              title="Ver histórico de fechamentos"
              onClick={() =>
                setMostrarHistorico((v) => !v)
              }
            >
               Histórico de Fechamento
              <span className="btn-historico-count">
                {fechamentos.length}
              </span>
            </button>

          )
        }

      </div>

      {
        mostrarHistorico &&
        fechamentos.length > 0 && (

          <div
            className="historico-lista"
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

      <Outlet context={outletContext} />

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
