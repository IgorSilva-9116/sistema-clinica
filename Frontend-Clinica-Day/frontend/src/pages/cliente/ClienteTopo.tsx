import type { ReactNode } from 'react'
import logoClinica from '../../assets/images/Logo_Day_branca-removebg-preview.png'

interface ClienteTopoProps {
  titulo?: string
  subtitulo?: string
  // "grande" = página da clínica; "compacto" = demais telas
  variante?: 'grande' | 'compacto'
  acao?: ReactNode
  children?: ReactNode
}

// Topo com a logo da clínica, usado em todas as telas da cliente
export function ClienteTopo({ titulo, subtitulo, variante = 'compacto', acao, children }: ClienteTopoProps) {
  return (
    <header className={`cli-topo cli-topo-${variante}`}>
      <div className="cli-topo-conteudo">
        {acao && <div className="cli-topo-acao">{acao}</div>}

        <img src={logoClinica} alt="Dayênia Neves Estética" className="cli-topo-logo" />

        {titulo && <h1 className="cli-topo-titulo">{titulo}</h1>}
        {subtitulo && <p className="cli-topo-sub">{subtitulo}</p>}

        {children}
      </div>
    </header>
  )
}
