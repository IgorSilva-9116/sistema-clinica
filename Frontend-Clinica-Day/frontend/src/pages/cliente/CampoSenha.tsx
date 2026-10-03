import { useState } from 'react'

interface CampoSenhaProps {
  id: string
  label: string
  value: string
  onChange: (valor: string) => void
  autoComplete?: string
  dica?: string
}

// Campo de senha com botão "Mostrar" grande, fácil de tocar no celular
export function CampoSenha({ id, label, value, onChange, autoComplete, dica }: CampoSenhaProps) {
  const [mostrar, setMostrar] = useState(false)

  return (
    <div className="cli-campo">
      <label htmlFor={id}>{label}</label>
      <div className="cli-campo-senha">
        <input
          id={id}
          type={mostrar ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          autoComplete={autoComplete}
          required
        />
        <button
          type="button"
          className="cli-btn cli-btn-secundario cli-btn-mini"
          onClick={() => setMostrar(atual => !atual)}
        >
          {mostrar ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>
      {dica && <span className="cli-dica">{dica}</span>}
    </div>
  )
}
