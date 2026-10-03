import { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { FiArrowLeft } from 'react-icons/fi'
import {
  clientePortalService,
  formatarTelefone,
  senhaClienteValida,
  MENSAGEM_SENHA_CLIENTE
} from '../../services/clientePortalService'
import { CampoSenha } from './CampoSenha'
import { useCliente } from './useCliente'

function mensagemDoErro(error: unknown, padrao: string) {
  return axios.isAxiosError(error) && error.response?.data?.mensagem
    ? error.response.data.mensagem
    : padrao
}

export function ClientePerfil() {
  const { perfil, recarregarPerfil } = useCliente()

  const [nome, setNome] = useState(perfil.nome)
  const [telefone, setTelefone] = useState(formatarTelefone(perfil.telefone))
  const [sexo, setSexo] = useState(perfil.sexo || '')
  const [dataNascimento, setDataNascimento] = useState(perfil.dataNascimento?.slice(0, 10) || '')
  const [avisoDados, setAvisoDados] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)
  const [salvandoDados, setSalvandoDados] = useState(false)

  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [avisoSenha, setAvisoSenha] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)
  const [salvandoSenha, setSalvandoSenha] = useState(false)

  async function salvarDados(e: React.FormEvent) {
    e.preventDefault()
    setAvisoDados(null)
    setSalvandoDados(true)

    try {
      await clientePortalService.atualizarPerfil({
        nome,
        telefone,
        sexo: sexo || null,
        dataNascimento: dataNascimento || null
      })
      await recarregarPerfil()
      setAvisoDados({ tipo: 'sucesso', texto: 'Dados salvos!' })
    } catch (error) {
      setAvisoDados({ tipo: 'erro', texto: mensagemDoErro(error, 'Não foi possível salvar seus dados') })
    } finally {
      setSalvandoDados(false)
    }
  }

  async function salvarSenha(e: React.FormEvent) {
    e.preventDefault()
    setAvisoSenha(null)

    if (!senhaClienteValida(novaSenha)) {
      setAvisoSenha({ tipo: 'erro', texto: MENSAGEM_SENHA_CLIENTE })
      return
    }

    if (novaSenha !== confirmarSenha) {
      setAvisoSenha({ tipo: 'erro', texto: 'As senhas novas não são iguais' })
      return
    }

    setSalvandoSenha(true)

    try {
      await clientePortalService.alterarSenha(senhaAtual, novaSenha)
      setSenhaAtual('')
      setNovaSenha('')
      setConfirmarSenha('')
      setAvisoSenha({ tipo: 'sucesso', texto: 'Senha alterada!' })
    } catch (error) {
      setAvisoSenha({ tipo: 'erro', texto: mensagemDoErro(error, 'Não foi possível alterar a senha') })
    } finally {
      setSalvandoSenha(false)
    }
  }

  return (
    <>
      <Link to="/cliente" className="cli-link cli-voltar">
        <FiArrowLeft aria-hidden="true" /> Voltar
      </Link>

      <form className="cli-card" onSubmit={salvarDados}>
        <h2>Meus dados</h2>

        {avisoDados && (
          <div className={`cli-alerta cli-alerta-${avisoDados.tipo}`}>{avisoDados.texto}</div>
        )}

        <div className="cli-campo">
          <label htmlFor="nome">Nome completo</label>
          <input id="nome" value={nome} onChange={e => setNome(e.target.value)} required />
        </div>

        <div className="cli-campo">
          <label htmlFor="telefone">Celular (WhatsApp)</label>
          <input
            id="telefone"
            type="tel"
            inputMode="tel"
            value={telefone}
            onChange={e => setTelefone(e.target.value)}
            required
          />
        </div>

        <div className="cli-campo">
          <label htmlFor="email">E-mail</label>
          <input id="email" value={perfil.email || 'Não informado'} disabled />
          <span className="cli-dica">Para incluir ou trocar o e-mail, fale conosco</span>
        </div>

        <div className="cli-campo">
          <label htmlFor="nascimento">Data de nascimento</label>
          <input
            id="nascimento"
            type="date"
            value={dataNascimento}
            onChange={e => setDataNascimento(e.target.value)}
            required
          />
        </div>

        <div className="cli-campo">
          <label htmlFor="sexo">Sexo</label>
          <select id="sexo" value={sexo} onChange={e => setSexo(e.target.value)}>
            <option value="">Prefiro não informar</option>
            <option value="Feminino">Feminino</option>
            <option value="Masculino">Masculino</option>
          </select>
        </div>

        <button type="submit" className="cli-btn cli-btn-primario" disabled={salvandoDados}>
          {salvandoDados ? 'Salvando…' : 'Salvar dados'}
        </button>
      </form>

      <form className="cli-card" onSubmit={salvarSenha}>
        <h2>Trocar senha</h2>

        {avisoSenha && (
          <div className={`cli-alerta cli-alerta-${avisoSenha.tipo}`}>{avisoSenha.texto}</div>
        )}

        <CampoSenha
          id="senha-atual"
          label="Senha atual"
          value={senhaAtual}
          onChange={setSenhaAtual}
          autoComplete="current-password"
        />

        <CampoSenha
          id="senha-nova"
          label="Nova senha"
          value={novaSenha}
          onChange={setNovaSenha}
          autoComplete="new-password"
          dica="Mínimo 8 caracteres, com letras e números"
        />

        <CampoSenha
          id="senha-confirmar"
          label="Repita a nova senha"
          value={confirmarSenha}
          onChange={setConfirmarSenha}
          autoComplete="new-password"
        />

        <button type="submit" className="cli-btn cli-btn-primario" disabled={salvandoSenha}>
          {salvandoSenha ? 'Salvando…' : 'Trocar senha'}
        </button>
      </form>
    </>
  )
}
