import { useState } from 'react'

interface PasswordInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function PasswordInput({
  value,
  onChange,
  placeholder
}: PasswordInputProps) {
  const [mostrar, setMostrar] = useState(false)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <input
        type={mostrar ? 'text' : 'password'}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />

      <button
        type="button"
        onClick={() => setMostrar(prev => !prev)}
        style={{
          cursor: 'pointer',
          border: 'none',
          background: 'transparent'
        }}
      >
        {mostrar ? '🙈' : '👁'}
      </button>
    </div>
  )
}