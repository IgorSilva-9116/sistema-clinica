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
    gerarRelatorio
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