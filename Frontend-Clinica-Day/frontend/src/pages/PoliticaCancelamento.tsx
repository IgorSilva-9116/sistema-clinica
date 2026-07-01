import { useEffect, useState } from 'react'
import { api } from '../services/api'

export default function PoliticaCancelamento() {
  const [janelaHoras, setJanelaHoras] = useState<number>(0)
  const [multaPercentual, setMultaPercentual] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    async function carregar() {
      try {
        const resp = await api.get('/clinica/configuracoes')
        setJanelaHoras(resp.data.JanelaCancelamentoHoras)
        setMultaPercentual(resp.data.MultaPercentual)
      } catch {
        alert('Erro ao carregar política de cancelamento')
      } finally {
        setLoading(false)
      }
    }

    carregar()
  }, [])

  async function salvar() {
    if (janelaHoras < 0 || multaPercentual < 0 || multaPercentual > 100) {
      alert('Valores inválidos')
      return
    }

    setSalvando(true)

    try {
      await api.put('/clinica/configuracoes', {
        janelaCancelamentoHoras: janelaHoras,
        multaPercentual
      })
      alert('Política de cancelamento salva com sucesso')
    } catch {
      alert('Erro ao salvar política de cancelamento')
    } finally {
      setSalvando(false)
    }
  }

  if (loading) return <p>Carregando política de cancelamento...</p>

  return (
    <div style={{ maxWidth: 500 }}>
      <h1>Política de Cancelamento</h1>

      <p>
        Defina as regras de cancelamento aplicadas aos clientes.
      </p>

      <div>
        <label>
          Janela de cancelamento sem multa (horas):
          <input
            type="number"
            value={janelaHoras}
            min={0}
            onChange={e => setJanelaHoras(Number(e.target.value))}
          />
        </label>
      </div>

      <div>
        <label>
          Multa por cancelamento tardio (%):
          <input
            type="number"
            value={multaPercentual}
            min={0}
            max={100}
            onChange={e => setMultaPercentual(Number(e.target.value))}
          />
        </label>
      </div>

      <button onClick={salvar} disabled={salvando}>
        {salvando ? 'Salvando...' : 'Salvar'}
      </button>
    </div>
  )
}
