import { NavLink, Outlet } from 'react-router-dom'
import '../styles/relatorios.css'
import {
  RelatoriosProvider
} from '../contexts/RelatoriosContext'

export default function Relatorios() {
 return (

  <RelatoriosProvider>

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
      <Outlet />

  </div>

  </RelatoriosProvider>

)
}