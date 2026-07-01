import { Link } from 'react-router-dom'

export function AcessoNegado() {
  return (
    <div>
      <h2>Acesso negado</h2>
      <p>Você não tem permissão para acessar esta página.</p>
      <Link to="/">Voltar para a Home</Link>
    </div>
  )
}
