import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useState } from 'react'

export function MainLayout() {
  const { logout, usuario } = useAuth()
  const navigate = useNavigate()

  const [menuAberto, setMenuAberto] = useState<string | null>(null)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  function toggleMenu(menu: string) {
    setMenuAberto(prev => (prev === menu ? null : menu))
  }

  function fecharMenu() {
    setMenuAberto(null)
  }

  return (
    <div>
      {/* ===== MENU SUPERIOR ===== */}
      <header style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
        <nav style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>

          {/* Home */}
          <Link to="/" onClick={fecharMenu}>Home</Link>

          {/* ===== MENU CLÍNICA ===== */}
          {usuario?.userTipo === 'clinica' && (
            <>
           
            {/* USUÁRIOS (somente MASTER) */}
            {usuario?.role === 'MASTER' && (
              <div style={{ position: 'relative' }}>
                <button onClick={() => toggleMenu('usuarios')}>
                Usuários ▾
                </button>

              {menuAberto === 'usuarios' && (
                <div style={dropdownStyle}>
                  <Link to="/usuarios" onClick={fecharMenu}>
                  Gerenciar Usuários
                  </Link>

                  <Link to="/usuarios/novo" onClick={fecharMenu}>
                  Novo Usuário
                  </Link>
                </div>
                )}
                 </div>
               )}
 
              {/* CLIENTES */}
              <div style={{ position: 'relative' }}>
                <button onClick={() => toggleMenu('clientes')}>
                  Clientes ▾
              </button>
              {menuAberto === 'clientes' && (
                 <div style={dropdownStyle}>
                    <Link to="/clientes" onClick={fecharMenu}>
                     Listar Clientes
                   </Link>
                   <Link to="/clientes/novo" onClick={fecharMenu}>
                    Novo Cliente
                   </Link>
                   <Link to="/clientes/aniversariantes" onClick={fecharMenu}>
                    🎂 Aniversariantes
                   </Link>
                  </div>
                  )}
                 </div>

              {/* SERVIÇOS */}
              <div style={{ position: 'relative' }}>
                <button onClick={() => toggleMenu('servicos')}>
                  Serviços ▾
                </button>
                {menuAberto === 'servicos' && (
                  <div style={dropdownStyle}>
                    <Link to="/servicos" onClick={fecharMenu}>Listar Serviços</Link>
                    <Link to="/servicos/novo" onClick={fecharMenu}>Novo Serviço</Link>
                  </div>
                )}
              </div>

              {/* AGENDA */}
              <div style={{ position: 'relative' }}>
                <button onClick={() => toggleMenu('agenda')}>
                  Agenda ▾
                </button>
                {menuAberto === 'agenda' && (
                  <div style={dropdownStyle}>
                    <Link to="/agenda" onClick={fecharMenu}>Agenda</Link>
                    <Link to="/agendamentos/novo" onClick={fecharMenu}>Novo Agendamento</Link>
                    <Link to="/configurar-agenda" onClick={fecharMenu}>Configurar Agenda</Link>
                    <Link to="/excecoes/gerenciar" onClick={fecharMenu}>Exceções da Agenda</Link>
                  </div>
                )}
              </div>

                {/* LISTA DE ESPERA */}
              <Link to="/lista-espera" onClick={fecharMenu}> Lista de Espera</Link>
              
              {/* FINANCEIRO */}
             <div style={{ position: 'relative' }}>
              <button onClick={() => toggleMenu('financeiro')}>
                Financeiro ▾
              </button>
               
             {menuAberto === 'financeiro' && (
             <div style={dropdownStyle}>
              <Link to="/despesas" onClick={fecharMenu}>
               Despesas
             </Link>

             {/* futuro */}
             {/* <Link to="/financeiro/resumo">Resumo</Link> */}
             </div>
               )}
              </div>

              {/* RELATÓRIOS */}
              <div style={{ position: 'relative' }}>
                <button onClick={() => toggleMenu('relatorios')}>
                  Relatórios ▾
                </button>
                {menuAberto === 'relatorios' && (
                  <div style={dropdownStyle}>
                    <Link to="/relatorios" onClick={fecharMenu}>Resumo Financeiro</Link>
                    <Link to="/relatorios/clientes" onClick={fecharMenu}>Relatório de Clientes</Link>
                  </div>
                )}
              </div>
                            
              {/* POLÍTICA */}
              <div style={{ position: 'relative' }}>
                <button onClick={() => toggleMenu('políticas')}>
                  Políticas ▾
                </button>
                {menuAberto === 'políticas' && (
                  <div style={dropdownStyle}>
                    <Link to="/politica-cancelamento" onClick={fecharMenu}>Política de Cancelamento</Link>
                    <Link to="/politica-agendamento" onClick={fecharMenu}>Poítica de Agendamento</Link>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Espaçador */}
          <div style={{ flex: 1 }} />

          {/* Usuário logado */}
          {usuario && (
            <>
              <span>
                {usuario.email} ({usuario.userTipo})
              </span>
              <button onClick={handleLogout}>
                Sair
              </button>
            </>
          )}
        </nav>
      </header>

      {/* ===== CONTEÚDO ===== */}
      <main style={{ padding: '20px' }}>
        <Outlet />
      </main>
    </div>
  )
}

/* ===== ESTILO DO DROPDOWN ===== */
const dropdownStyle: React.CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: 0,
  background: '#fff',
  border: '1px solid #ccc',
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  zIndex: 1000
}