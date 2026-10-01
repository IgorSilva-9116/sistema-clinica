import { Link, useLocation } from 'react-router-dom'
import '../../styles/breadcrumbs.css'

type CrumbConfig = {
  label: string
  parent?: string
}

// Mapa da hierarquia de rotas. Baseado no AppRoutes.tsx atual.
// Rotas de topo (sem "parent") não aparecem sozinhas no breadcrumb —
// só quando há uma rota filha abaixo delas (ver renderização mais abaixo).
const ROUTES: Record<string, CrumbConfig> = {

  '/agenda': { label: 'Agenda' },
  '/configurar-agenda': { label: 'Configurações da Agenda', parent: '/agenda' },
  '/excecoes/gerenciar': { label: 'Exceções da Agenda', parent: '/agenda' },
  '/agendamentos/novo': { label: 'Novo Agendamento', parent: '/agenda' },

  '/lista-espera': { label: 'Lista de Espera' },

  '/despesas': { label: 'Financeiro' },
  '/despesas/lista': { label: 'Lista de Despesas', parent: '/despesas' },
  '/categorias-financeiras': { label: 'Categorias Financeiras', parent: '/despesas' },

  '/politicas': { label: 'Políticas' },
  '/politicas/cancelamento': { label: 'Cancelamento', parent: '/politicas' },
  '/politicas/agendamento': { label: 'Agendamento', parent: '/politicas' },

  '/clientes': { label: 'Clientes' },
  '/clientes/novo': { label: 'Novo Cliente', parent: '/clientes' },
  '/clientes/aniversariantes': { label: 'Aniversariantes', parent: '/clientes' },

  '/usuarios': { label: 'Usuários' },
  '/usuarios/novo': { label: 'Novo Usuário', parent: '/usuarios' },

  '/servicos': { label: 'Serviços' },
  '/servicos/novo': { label: 'Novo Serviço', parent: '/servicos' },
  '/categorias-servico': { label: 'Categorias de Serviço', parent: '/servicos' },

  '/relatorios': { label: 'Relatórios' },
  '/relatorios/financeiro': { label: 'Financeiro', parent: '/relatorios' },
  '/relatorios/clientes': { label: 'Clientes', parent: '/relatorios' },
  '/relatorios/servicos': { label: 'Serviços', parent: '/relatorios' }

}

function resolveConfig(pathname: string): CrumbConfig | null {

  if (ROUTES[pathname]) return ROUTES[pathname]

  // Rotas dinâmicas (/clientes/editar/:id e afins)
  if (pathname.startsWith('/clientes/editar/')) {
    return { label: 'Editar Cliente', parent: '/clientes' }
  }

  if (pathname.startsWith('/usuarios/editar/')) {
    return { label: 'Editar Usuário', parent: '/usuarios' }
  }

  if (pathname.startsWith('/servicos/editar/')) {
    return { label: 'Editar Serviço', parent: '/servicos' }
  }

  return null
}

function buildTrail(pathname: string) {

  const trail: { label: string; path: string }[] = []

  let current: string | undefined = pathname
  let guard = 0

  while (current && guard < 10) {

    const cfg = resolveConfig(current)

    if (!cfg) break

    trail.unshift({ label: cfg.label, path: current })

    if (!cfg.parent || cfg.parent === current) break

    current = cfg.parent
    guard++

  }

  return trail
}

export function Breadcrumbs() {

  const location = useLocation()
  const trail = buildTrail(location.pathname)

  // Só mostra quando há profundidade real (seção + subpágina).
  // Uma rota de topo sozinha (ex: só "/clientes") já está indicada
  // pelo item ativo na sidebar — o breadcrumb seria redundante.
  if (trail.length < 2) return null

  return (
    <nav className="breadcrumbs" aria-label="Caminho de navegação">

      {trail.map((item, index) => {

        const isLast = index === trail.length - 1

        return (
          <span key={item.path} className="breadcrumb-item">

            {isLast ? (
              <span className="breadcrumb-current">
                {item.label}
              </span>
            ) : (
              <Link to={item.path}>
                {item.label}
              </Link>
            )}

            {!isLast && (
              <span className="breadcrumb-separator">/</span>
            )}

          </span>
        )

      })}

    </nav>
  )
}