import { NavLink, Outlet } from 'react-router-dom'
import '../styles/politicas.css'

export default function Politicas() {
  return (
    <div className="politica-container">

      <h1>Políticas</h1>

      <p className="politica-subtitulo">
        Defina as regras de agendamento e cancelamento aplicadas aos clientes.
      </p>

      <nav className="politica-nav">

        <NavLink to="cancelamento">
          Cancelamento
        </NavLink>

        <NavLink to="agendamento">
          Agendamento
        </NavLink>

      </nav>

      <Outlet />

    </div>
  )
}