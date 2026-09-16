import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import '../styles/listaEspera.css'

export function ListaEspera() {
  const [lista, setLista] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dataFiltro, setDataFiltro] = useState('')

  const navigate = useNavigate()

  async function carregar() {
    try {
      const res = await api.get('/lista-espera')
      setLista(res.data.lista)
    } catch {
      alert('Erro ao carregar lista')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  if (loading) return <p>Carregando...</p>

  return (
    <div className="lista-espera-container">

      <div className="config-header">

        <div>
          <h1>Lista de Espera</h1>

          <p className="lista-espera-subtitulo">
            Gerencie clientes aguardando disponibilidade de horários.
          </p>
        </div>

        <button
          className="btn-voltar-agenda"
          onClick={() => navigate('/agenda')}
        >
          Voltar
        </button>

      </div>

      <div className="lista-espera-card">

        <div className="campo-filtro">
          <label>Filtrar por data</label>

          <input
            type="date"
            value={dataFiltro}
            onChange={(e) => setDataFiltro(e.target.value)}
          />
        </div>

      </div>

      {lista.length === 0 && (
        <div className="lista-vazia">
          Nenhum cliente na lista de espera.
        </div>
      )}

      {lista
        .filter(item => {
          if (!dataFiltro) return true

          const dataFiltroFormatada =
            dataFiltro.split('-').reverse().join('/')

          return item.DataFormatada === dataFiltroFormatada
        })
        .map(item => (
          <div
            key={item.Id}
            className="espera-card"
          >

            <div className="espera-header">
              <strong>{item.Cliente}</strong>

              <span>
                {item.DataFormatada}
              </span>
            </div>

            <div className="espera-servico">
              {item.Servico}
            </div>

            <div className="espera-horario">
              Horário desejado: {item.HoraDesejada}
            </div>

          </div>
        ))}
    </div>
  )
}