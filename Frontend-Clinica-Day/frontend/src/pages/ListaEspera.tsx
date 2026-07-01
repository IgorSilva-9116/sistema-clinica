import { useEffect, useState } from 'react'
import { api } from '../services/api'

export function ListaEspera() {
  const [lista, setLista] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dataFiltro, setDataFiltro] = useState('')

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
    <div>
      <div style={{ marginBottom: 15 }}>
        <label>Filtrar por data: </label>
        <input
         type="date"
         value={dataFiltro}
         onChange={(e) => setDataFiltro(e.target.value)}
        />
      </div>
      <h2>Lista de Espera</h2>

      {lista.length === 0 && <p>Nenhum cliente na fila</p>}

      {lista
        .filter(item => {
          if (!dataFiltro) return true

          const dataItem = item.DataFormatada // ex: 22/05/2026
          const dataFiltroFormatada = dataFiltro
            .split('-')
            .reverse()
            .join('/')

          return dataItem === dataFiltroFormatada
        })
        .map(item => (
        <div key={item.Id} style={{ marginBottom: 10 }}>
          <strong>{item.Cliente}</strong><br />
          {item.Servico} <br />
          {item.DataFormatada} - {item.HoraDesejada}
        </div>
      ))}
    </div>
  )
}