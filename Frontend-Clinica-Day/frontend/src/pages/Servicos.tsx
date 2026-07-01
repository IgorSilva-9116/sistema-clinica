import { useEffect, useState } from 'react'
import { servicoService } from '../services/servicoService'
import type { Servico } from '../types/Servico'

export function Servicos() {
  const [servicos, setServicos] = useState<Servico[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  async function carregar() {
    try {
      const response = await servicoService.listarAdmin()

      const servicosValidos = (response.servicos || []).filter(s =>
        s &&
        s.id &&
        s.titulo &&
        s.preco !== undefined &&
        s.duracaoMinutos !== undefined &&
        s.status
      )

      setServicos(servicosValidos)
    } catch {
      setErro('Erro ao carregar serviços')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  async function toggleStatus(servico: Servico) {
    try {
      if (servico.status === 'Ativo') {
        await servicoService.desativar(servico.id)
      } else {
        await servicoService.ativar(servico.id)
      }
      carregar()
    } catch {
      setErro('Erro ao alterar status do serviço')
    }
  }

  if (loading) return <p>Carregando serviços...</p>
  if (erro) return <p>{erro}</p>

  return (
    <div>
      <h2>Serviços</h2>

      {servicos.length === 0 && (
        <p>Nenhum serviço cadastrado.</p>
      )}

      {servicos.length > 0 && (
        <table border={1} cellPadding={8} style={{ marginTop: 15 }}>
          <thead>
            <tr>
              <th>Serviço</th>
              <th>Preço</th>
              <th>Duração</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>

          <tbody>
            {servicos.map(servico => (
              <tr key={servico.id}>

                {/* ✅ TÍTULO + DESCRIÇÃO */}
                <td>
                  <strong>{servico.titulo}</strong>
                  
                  <br />

                  <small style={{ color: '#666' }}>
                    {servico.descricao
                      ? servico.descricao
                      : 'Sem descrição'}
                  </small>
                </td>

                <td>R$ {servico.preco}</td>

                <td>{servico.duracaoMinutos} min</td>

                <td>
                  {servico.status === 'Ativo' ? (
                    <span style={{ color: 'green', fontWeight: 'bold' }}>
                      Ativo
                    </span>
                  ) : (
                    <span style={{ color: 'red', fontWeight: 'bold' }}>
                      Inativo
                    </span>
                  )}
                </td>

                <td>
                  <button onClick={() => toggleStatus(servico)}>
                    {servico.status === 'Ativo'
                      ? 'Desativar'
                      : 'Ativar'}
                  </button>

                  {' '}

                  <button
                    onClick={() =>
                      window.location.href = `/servicos/editar/${servico.id}`
                    }
                  >
                    Editar
                  </button>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}