import { useEffect, useState } from 'react'
import { api } from '../services/api'

export function PoliticaAgendamento() {
  const [politica, setPolitica] = useState('')
  const [loading, setLoading] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)

  // ✅ carregar política
  useEffect(() => {
    async function carregar() {
      try {
        const res = await api.get('/clinica/politica')
        setPolitica(res.data.politica || '')
      } catch {
        setErro('Erro ao carregar política')
      } finally {
        setCarregando(false)
      }
    }

    carregar()
  }, [])

  // ✅ salvar política
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    setLoading(true)
    setErro(null)
    setSucesso(false)

    try {
      await api.put('/clinica/politica', {
        politica
      })

      setSucesso(true)
    } catch {
      setErro('Erro ao salvar política')
    } finally {
      setLoading(false)
    }
  }

  if (carregando) {
    return (
      <p className="politica-loading">
        Carregando política de agendamento...
      </p>
    )
  }

  return (
    <div className="politica-card">

      {erro && (
        <div className="politica-alert politica-alert-erro">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="politica-alert politica-alert-sucesso">
          Política de agendamento salva com sucesso!
        </div>
      )}

      <form onSubmit={handleSubmit}>

        <div className="politica-form-group">

          <label>Texto da política</label>

          <textarea
            className="politica-textarea"
            value={politica}
            onChange={(e) => setPolitica(e.target.value)}
            rows={8}
            placeholder="Ex: Cancelamento deve ser feito com 24h de antecedência..."
          />

          <span className="politica-charcount">
            {politica.length} caracteres
          </span>

        </div>

        <div className="politica-actions">
          <button type="submit" disabled={loading}>
            {loading ? 'Salvando...' : '💾 Salvar'}
          </button>
        </div>

      </form>

    </div>
  )
}