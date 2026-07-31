import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useState } from 'react'
import '../../styles/sidebar.css'
import logoDay from '../../assets/images/Logo_Day_branca-removebg-preview.png'
import { FiHome, FiUsers, FiUser, FiCalendar, FiClock, FiDollarSign, FiBarChart2, FiSettings, FiLogOut, FiChevronLeft, FiChevronRight } from 'react-icons/fi'

export function MainLayout() {
  const { logout, usuario } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="layout-container">

      <aside className={
        collapsed
          ? 'sidebar collapsed'
          : 'sidebar'
      }
      >
        <button
          className="sidebar-toggle"
          onClick={() =>
            setCollapsed(!collapsed)
          }
        >
          {collapsed
            ? <FiChevronRight />
            : <FiChevronLeft />
          }
        </button>

        <div className="sidebar-logo">
          <img
            src={logoDay}
            alt="Dayênia Neves Estética"
            className="sidebar-logo-img"
          />
        </div>

        <div className="sidebar-menu">

          <NavLink to="/" end className={({ isActive }) => isActive ? 'active-link' : ''} >
            <span className="menu-icon">
              <FiHome />
            </span>

            <span className="menu-text">
              Dashboard
            </span>

          </NavLink>

          {usuario?.role === 'MASTER' && (
            <NavLink
              to="/usuarios"
              className={({ isActive }) =>
                isActive ? 'active-link' : ''
              }
            >
              <span className="menu-icon">
                <FiUsers />
              </span>

              <span className="menu-text">
                Usuários
              </span>

            </NavLink>
          )}

          <NavLink
            to="/clientes"
            className={({ isActive }) =>
              isActive ? 'active-link' : ''
            }
          >
            <span className="menu-icon">
              <FiUser />
            </span>

            <span className="menu-text">
              Clientes
            </span>

          </NavLink>

          <NavLink
            to="/servicos"
            className={({ isActive }) =>
              isActive ? 'active-link' : ''
            }
          >
            <span className="menu-icon">
              <FiUser />

            </span>

            <span className="menu-text">
              Serviços
            </span>

          </NavLink>

          <NavLink
            to="/agenda"
            className={({ isActive }) =>
              isActive ? 'active-link' : ''
            }
          >
            <span className="menu-icon">
              <FiCalendar />
            </span>

            <span className="menu-text">
              Agenda
            </span>
          </NavLink>

          <NavLink
            to="/lista-espera"
            className={({ isActive }) =>
              isActive ? 'active-link' : ''
            }
          >
            <span className="menu-icon">
              <FiClock />
            </span>

            <span className="menu-text">
              Lista de Espera
            </span>
          </NavLink>

          <NavLink
            to="/despesas"
            className={({ isActive }) =>
              isActive ? 'active-link' : ''
            }
          >
            <span className="menu-icon">
              <FiDollarSign />
            </span>

            <span className="menu-text">
              Financeiro
            </span>
          </NavLink>

          <NavLink
            to="/relatorios"
            className={({ isActive }) =>
              isActive ? 'active-link' : ''
            }
          >
            <span className="menu-icon">
              <FiBarChart2 />
            </span>

            <span className="menu-text">
              Relatórios
            </span>
          </NavLink>

          <NavLink
            to="/politica-cancelamento"
            className={({ isActive }) =>
              isActive ? 'active-link' : ''
            }
          >
            <span className="menu-icon">
              <FiSettings />
            </span>

            <span className="menu-text">
              Políticas
            </span>

          </NavLink>

        </div>

        <div className="sidebar-footer">

          <div className="sidebar-user">
            👤 Clínica Dayênia
          </div>

          <button
            className="sidebar-logout"
            onClick={handleLogout}
          >
            {collapsed
              ? <FiLogOut />
              : 'Sair'
            }
          </button>

        </div>

      </aside>

      <main className="main-content">
        <Outlet />
      </main>

    </div>
  )
}


