import { useEffect, useState } from 'react'
import { api } from '../services/api'

export function PoliticaAgendamento() {
  const [politica, setPolitica] = useState('')
  const [loading, setLoading] = useState(false)
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

  return (
    <div>
      <h2>Política de Agendamento</h2>

      <p>Defina as regras que serão mostradas antes do cliente agendar.</p>

      {erro && <p style={{ color: 'red' }}>{erro}</p>}
      {sucesso && <p style={{ color: 'green' }}>Salvo com sucesso!</p>}

      <form onSubmit={handleSubmit}>
        <textarea
          value={politica}
          onChange={(e) => setPolitica(e.target.value)}
          rows={8}
          style={{ width: 400 }}
          placeholder="Ex: Cancelamento deve ser feito com 24h de antecedência..."
        />

        <br /><br />

        <button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
      </form>
    </div>
  )
}