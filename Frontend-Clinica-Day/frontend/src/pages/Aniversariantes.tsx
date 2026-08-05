import { useEffect, useState } from 'react'
import { clienteService } from '../services/clienteService'
import { useNavigate } from 'react-router-dom'
import '../styles/aniversariantes.css'

type Aniversariante = {
  id: number
  nome: string
  telefone: string
  dataNascimento: string
}

export default function Aniversariantes() {
  const [dados, setDados] = useState<Aniversariante[]>([])
  const [loading, setLoading] = useState(true)

  const navigate = useNavigate()

  useEffect(() => {
    async function carregar() {
      try {
        const response =
          await clienteService.listarAniversariantes()

        setDados(
          response.aniversariantes || []
        )
      } finally {
        setLoading(false)
      }
    }

    carregar()
  }, [])

  if (loading) {
    return (
      <p>Carregando aniversariantes...</p>
    )
  }

  return (
    <div className="aniversariantes-container">

      <div className="aniversariantes-header">

        <div className="aniversariantes-title">

          <h1>
            🎂 Aniversariantes do Mês
          </h1>

          <p>
            Visualize os aniversariantes cadastrados.
          </p>

        </div>

        <button
          className="btn-voltar"
          onClick={() =>
            navigate('/clientes')
          }
        >
          Voltar
        </button>

      </div>

      <div className="aniversariantes-card">

        <div className="aniversariantes-counter">
          Total de aniversariantes: {dados.length}
        </div>

        {dados.length === 0 ? (

          <div className="aniversariantes-empty">
            Nenhum aniversariante neste mês.
          </div>

        ) : (

          <table className="aniversariantes-table">

            <thead>
              <tr>
                <th>Nome</th>
                <th>Telefone</th>
                <th>Data de Nascimento</th>
              </tr>
            </thead>

            <tbody>

              {dados.map(cliente => (

                <tr key={cliente.id}>

                  <td>
                    {cliente.nome}
                  </td>

                  <td>
                    {cliente.telefone}
                  </td>

                  <td>
                    {new Date(
                      cliente.dataNascimento
                    ).toLocaleDateString(
                      'pt-BR'
                    )}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        )}

      </div>

    </div>
  )
}