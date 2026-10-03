import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { FiAlertTriangle, FiArrowLeft, FiCalendar, FiClock, FiMessageCircle, FiPlus } from 'react-icons/fi'
import {
  clientePortalService,
  dataPorExtenso,
  formatarPreco,
  linkWhatsApp,
  type Atendimento,
  type StatusAtendimento
} from '../../services/clientePortalService'
import { useCliente } from './useCliente'

const ROTULO_STATUS: Record<StatusAtendimento, string> = {
  CRIADO: 'Aguardando confirmação',
  CONFIRMADO: 'Confirmado',
  CANCELADO: 'Cancelado',
  FINALIZADO: 'Realizado'
}

function mensagemDoErro(error: unknown, padrao: string) {
  return axios.isAxiosError(error) && error.response?.data?.mensagem
    ? error.response.data.mensagem
    : padrao
}

export function ClienteAgendamentos() {
  const navigate = useNavigate()
  const { perfil } = useCliente()

  const [aba, setAba] = useState<'proximos' | 'historico'>('proximos')
  const [proximos, setProximos] = useState<Atendimento[]>([])
  const [historico, setHistorico] = useState<Atendimento[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  // Atendimento com a confirmação de cancelamento aberta
  const [cancelando, setCancelando] = useState<Atendimento | null>(null)
  const [enviando, setEnviando] = useState(false)

  const carregar = useCallback(async () => {
    const dados = await clientePortalService.listarAtendimentos()
    setProximos(dados.proximos)
    setHistorico(dados.historico)
  }, [])

  useEffect(() => {
    carregar()
      .catch(() => setErro('Não foi possível carregar seus agendamentos.'))
      .finally(() => setCarregando(false))

    // Abrir esta tela conta como "vi os avisos"
    clientePortalService.marcarNotificacoesLidas().catch(() => undefined)
  }, [carregar])

  async function confirmarCancelamento() {
    if (!cancelando) return

    setEnviando(true)
    setErro(null)

    try {
      const resposta = await clientePortalService.cancelarAtendimento(cancelando.id)
      setAviso(resposta.mensagem)
      setCancelando(null)
      await carregar()
    } catch (error) {
      setErro(mensagemDoErro(error, 'Não foi possível cancelar. Tente novamente.'))
    } finally {
      setEnviando(false)
    }
  }

  const lista = aba === 'proximos' ? proximos : historico

  return (
    <>
      <Link to="/cliente" className="cli-link cli-voltar">
        <FiArrowLeft aria-hidden="true" /> Voltar
      </Link>

      <div className="cli-abas" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={aba === 'proximos'}
          className={aba === 'proximos' ? 'ativa' : ''}
          onClick={() => setAba('proximos')}
        >
          Próximos {proximos.length > 0 && <span className="cli-aba-contador">{proximos.length}</span>}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={aba === 'historico'}
          className={aba === 'historico' ? 'ativa' : ''}
          onClick={() => setAba('historico')}
        >
          Histórico
        </button>
      </div>

      {aviso && <div className="cli-alerta cli-alerta-sucesso">{aviso}</div>}
      {erro && <div className="cli-alerta cli-alerta-erro">{erro}</div>}

      {carregando && <div className="cli-card"><p className="cli-carregando">Carregando…</p></div>}

      {!carregando && lista.length === 0 && (
        <div className="cli-card cli-vazio">
          <FiCalendar className="cli-vazio-icone" aria-hidden="true" />
          <p>{aba === 'proximos' ? 'Você não tem horários marcados.' : 'Nenhum atendimento anterior.'}</p>
          {aba === 'proximos' && (
            <button type="button" className="cli-btn cli-btn-primario" onClick={() => navigate('/cliente/agendar')}>
              <FiPlus aria-hidden="true" /> Agendar horário
            </button>
          )}
        </div>
      )}

      {lista.map(atendimento => (
        <article key={atendimento.id} className={`cli-card cli-atendimento cli-atendimento-${atendimento.status.toLowerCase()}`}>
          <div className="cli-atendimento-topo">
            <div>
              <p className="cli-atendimento-data">{dataPorExtenso(atendimento.data)}</p>
              <p className="cli-atendimento-hora">
                <FiClock aria-hidden="true" /> {atendimento.horaInicio} às {atendimento.horaFim}
              </p>
            </div>
            <span className={`cli-status cli-status-${atendimento.status.toLowerCase()}`}>
              {ROTULO_STATUS[atendimento.status]}
            </span>
          </div>

          <ul className="cli-atendimento-servicos">
            {atendimento.servicos.map(s => (
              <li key={s.id} className={s.status === 'CANCELADO' && atendimento.status !== 'CANCELADO' ? 'riscado' : ''}>
                <span>{s.titulo}</span>
                <span className="cli-texto-suave">{s.horaInicio}</span>
              </li>
            ))}
          </ul>

          <div className="cli-atendimento-total">
            <span>Total</span>
            <strong>{formatarPreco(atendimento.valorTotal)}</strong>
          </div>

          {atendimento.status === 'CANCELADO' && (
            <p className="cli-texto-suave cli-atendimento-obs">
              {atendimento.canceladoPor === 'CLINICA' ? 'Cancelado pela clínica' : 'Cancelado por você'}
              {atendimento.motivoCancelamento ? ` · ${atendimento.motivoCancelamento}` : ''}
              {atendimento.valorMulta > 0 ? ` · Multa de ${formatarPreco(atendimento.valorMulta)}` : ''}
            </p>
          )}

          {/* ---------- Confirmação de cancelamento ---------- */}
          {cancelando?.id === atendimento.id ? (
            <div className="cli-confirmar-cancelamento">
              {atendimento.multaSeCancelar && atendimento.multaSeCancelar.valor > 0 ? (
                <p className="cli-multa">
                  <FiAlertTriangle aria-hidden="true" />
                  <span>
                    Este cancelamento está fora do prazo e terá multa de
                    {' '}<strong>{atendimento.multaSeCancelar.percentual}% ({formatarPreco(atendimento.multaSeCancelar.valor)})</strong>,
                    cobrada na sua próxima visita.
                  </span>
                </p>
              ) : (
                <p>Tem certeza que deseja cancelar este horário?</p>
              )}

              <button type="button" className="cli-btn cli-btn-perigo" disabled={enviando} onClick={confirmarCancelamento}>
                {enviando ? 'Cancelando…' : 'Sim, cancelar'}
              </button>
              <button type="button" className="cli-btn cli-btn-secundario" disabled={enviando} onClick={() => setCancelando(null)}>
                Não, manter horário
              </button>
            </div>
          ) : atendimento.proximo && (
            <div className="cli-atendimento-acoes">
              {atendimento.podeRemarcar ? (
                <button
                  type="button"
                  className="cli-btn cli-btn-secundario"
                  onClick={() => navigate(`/cliente/agendar?remarcar=${atendimento.id}`)}
                >
                  Remarcar
                </button>
              ) : perfil.clinicaTelefone && (
                <a
                  className="cli-btn cli-btn-secundario"
                  href={linkWhatsApp(
                    perfil.clinicaTelefone,
                    `Olá! Preciso remarcar meu horário de ${dataPorExtenso(atendimento.data)} às ${atendimento.horaInicio}.`
                  )}
                  target="_blank"
                  rel="noreferrer"
                >
                  <FiMessageCircle aria-hidden="true" /> Remarcar: fale conosco
                </a>
              )}

              {atendimento.podeCancelar && (
                <button
                  type="button"
                  className="cli-btn cli-btn-contorno-perigo"
                  onClick={() => {
                    setAviso(null)
                    setCancelando(atendimento)
                  }}
                >
                  Cancelar
                </button>
              )}
            </div>
          )}
        </article>
      ))}
    </>
  )
}
