import { useCallback, useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { FiLogOut } from 'react-icons/fi'
import { useAuth } from '../../contexts/AuthContext'
import {
  clientePortalService,
  obterSlugClinica,
  salvarSlugClinica,
  type PerfilCliente
} from '../../services/clientePortalService'
import type { ClienteContexto } from './useCliente'
import { ClienteTopo } from './ClienteTopo'
import '../../styles/cliente.css'

// Moldura das telas logadas da cliente: topo com a clínica e botão Sair
export function ClienteLayout() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const [perfil, setPerfil] = useState<PerfilCliente | null>(null)
  const [erro, setErro] = useState(false)

  const aplicarPerfil = useCallback((dados: PerfilCliente) => {
    setPerfil(dados)
    salvarSlugClinica(dados.clinicaSlug)
  }, [])

  const recarregarPerfil = useCallback(async () => {
    aplicarPerfil(await clientePortalService.obterPerfil())
  }, [aplicarPerfil])

  useEffect(() => {
    clientePortalService.obterPerfil()
      .then(aplicarPerfil)
      .catch(() => setErro(true))
  }, [aplicarPerfil])

  function sair() {
    const slug = perfil?.clinicaSlug || obterSlugClinica()
    logout()
    navigate(slug ? `/c/${slug}` : '/login')
  }

  return (
    <div className="cli-page">
      <ClienteTopo
        acao={
          <button type="button" className="cli-btn-sair" onClick={sair}>
            <FiLogOut aria-hidden="true" /> Sair
          </button>
        }
      />

      <main className="cli-conteudo">
        {erro && (
          <div className="cli-alerta cli-alerta-erro">
            Não foi possível carregar seus dados. Saia e entre novamente.
          </div>
        )}

        {!erro && !perfil && <div className="cli-card"><p className="cli-carregando">Carregando…</p></div>}

        {perfil && <Outlet context={{ perfil, recarregarPerfil } satisfies ClienteContexto} />}
      </main>
    </div>
  )
}
