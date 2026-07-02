import { useEffect, useState } from 'react'
import { clienteService } from '../services/clienteService'
import { useNavigate } from 'react-router-dom'

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
        const response = await clienteService.listarAniversariantes()
        setDados(response.aniversariantes || [])
      } finally {
        setLoading(false)
      }
    }

    carregar()
  }, [])

  if (loading) {
    return <p>Carregando aniversariantes...</p>
  }

  return (
    <div>
      <button onClick={() => navigate('/clientes')}>
        ← Voltar para Clientes
      </button>

      <h2>🎂 Aniversariantes do Mês</h2>

      {dados.length === 0 ? (
        <p>Nenhum aniversariante neste mês.</p>
      ) : (
        <table border={1} cellPadding={8}>
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
                <td>{cliente.nome}</td>

                <td>{cliente.telefone}</td>

                <td>
                  {new Date(
                    cliente.dataNascimento
                  ).toLocaleDateString('pt-BR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}