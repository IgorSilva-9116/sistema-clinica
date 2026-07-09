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

      <h1>Relatórios</h1>

      <nav className="relatorio-nav">

        <NavLink to="">
          📊 Dashboard
        </NavLink>

        <NavLink to="financeiro">
          💰 Financeiro
        </NavLink>

        <NavLink to="clientes">
          👥 Clientes
        </NavLink>

        <NavLink to="servicos">
          🧴 Serviços
        </NavLink>

      </nav>

      <div className="filtros">

        <label>
          Data início:

          <input
            type="date"
            value={dataInicio}
            onChange={(e) =>
              setDataInicio(e.target.value)
            }
          />

        </label>

        <label>
          Data fim:

          <input
            type="date"
            value={dataFim}
            onChange={(e) =>
              setDataFim(e.target.value)
            }
          />

        </label>

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

      <div
         style={{
         marginBottom: 20
        }}
      >

        {mesFechado ? (

      <div
         style={{
         color: '#d32f2f',
         fontWeight: 'bold'
        }}
      >
        🔒 PERÍODO FECHADO
      </div>

       ) : (

      <div
        style={{
        color: '#2e7d32',
        fontWeight: 'bold'
       }}
      >
        🟢 PERÍODO ABERTO
      </div>

      )}

    </div>

    {
      !mesFechado &&
      dataInicio &&
      dataFim && (

     <button
        onClick={() =>
          fecharMes(
            dataInicio,
            dataFim
          )
        }
        style={{
          marginBottom: 25
        }}
      >
       🔒 Fechar Mês
     </button>

     )
    }

    {
  fechamentos.length > 0 && (

    <div
      style={{
        marginTop: 20,
        marginBottom: 25
      }}
    >

      <h3>
        🔒 Histórico de Fechamentos
      </h3>

      {fechamentos.map(
        (f: any) => (

          <div
            key={f.Id}
            style={{
              border: '1px solid #ddd',
              borderRadius: 8,
              padding: 12,
              marginBottom: 10,
              background: '#fafafa'
            }}
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