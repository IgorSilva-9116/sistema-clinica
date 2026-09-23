import { useEffect, useState } from 'react'
import { api } from '../services/api'
import '../styles/politicas.css'

export default function PoliticaCancelamento() {
  const [janelaHoras, setJanelaHoras] = useState<number>(0)
  const [multaPercentual, setMultaPercentual] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)

  useEffect(() => {
    async function carregar() {
      try {
        const resp = await api.get('/clinica/configuracoes')
        setJanelaHoras(resp.data.JanelaCancelamentoHoras)
        setMultaPercentual(resp.data.MultaPercentual)
      } catch {
        setErro('Erro ao carregar política de cancelamento')
      } finally {
        setLoading(false)
      }
    }

    carregar()
  }, [])

  async function salvar() {
    setErro(null)
    setSucesso(false)

    if (janelaHoras < 0 || multaPercentual < 0 || multaPercentual > 100) {
      setErro('Valores inválidos. A janela não pode ser negativa e a multa deve ficar entre 0% e 100%.')
      return
    }

    setSalvando(true)

    try {
      await api.put('/clinica/configuracoes', {
        janelaCancelamentoHoras: janelaHoras,
        multaPercentual
      })
      setSucesso(true)
    } catch {
      setErro('Erro ao salvar política de cancelamento')
    } finally {
      setSalvando(false)
    }
  }

  if (loading) {
    return (
      <div className="politica-container">
        <p className="politica-loading">
          Carregando política de cancelamento...
        </p>
      </div>
    )
  }

  return (
    <div className="politica-container">

      <h1>Política de Cancelamento</h1>

      <p className="politica-subtitulo">
        Defina as regras de cancelamento aplicadas aos clientes.
      </p>

      <div className="politica-card">

        {erro && (
          <div className="politica-alert politica-alert-erro">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="politica-alert politica-alert-sucesso">
            Política de cancelamento salva com sucesso!
          </div>
        )}

        <div className="politica-form-group">

          <label>Janela de cancelamento sem multa</label>

          <div className="politica-input-group">
            <input
              className="politica-input"
              type="number"
              value={janelaHoras}
              min={0}
              onChange={e => setJanelaHoras(Number(e.target.value))}
            />
            <span className="politica-input-suffix">horas</span>
          </div>

          <span className="politica-hint">
            Cancelamentos feitos dentro desse prazo antes do horário
            marcado não geram multa.
          </span>

        </div>

        <div className="politica-form-group">

          <label>Multa por cancelamento tardio</label>

          <div className="politica-input-group">
            <input
              className="politica-input"
              type="number"
              value={multaPercentual}
              min={0}
              max={100}
              onChange={e => setMultaPercentual(Number(e.target.value))}
            />
            <span className="politica-input-suffix">%</span>
          </div>

          <span className="politica-hint">
            Percentual do valor do serviço cobrado quando o cliente
            cancela fora da janela acima.
          </span>

        </div>

        <div className="politica-actions">
          <button onClick={salvar} disabled={salvando}>
            {salvando ? 'Salvando...' : '💾 Salvar'}
          </button>
        </div>

      </div>

    </div>
  )
}
