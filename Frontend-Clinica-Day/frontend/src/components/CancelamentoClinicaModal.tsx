import { useState } from 'react'
import axios from 'axios'
import { FiAlertTriangle, FiCheckCircle, FiMessageCircle, FiX } from 'react-icons/fi'
import { api } from '../services/api'
import { linkWhatsApp } from '../services/clientePortalService'

/**
 * Cancelamento feito pela clínica:
 * - "um": um agendamento (motivo + bloquear ou liberar o horário)
 * - "dia": todos os atendimentos do dia (imprevisto da profissional)
 * Depois de cancelar, mostra as clientes com botão para avisar no WhatsApp.
 */

interface AgendamentoResumo {
  Id: number
  Cliente: string
  Servico: string
  HoraInicio: string
  HoraFim: string
}

interface Props {
  modo: 'um' | 'dia'
  data: string          // YYYY-MM-DD
  dataTexto: string     // "terça-feira, 06/10/2026"
  agendamento?: AgendamentoResumo
  quantidadeNoDia?: number
  onFechar: () => void
  onConcluido: () => void
}

interface ClienteAvisar {
  nome: string
  telefone: string | null
  horario?: string
}

const MOTIVOS_RAPIDOS = [
  'Imprevisto da profissional',
  'Problema de saúde',
  'Pedido da cliente',
  'Clínica fechada'
]

export function CancelamentoClinicaModal({
  modo,
  data,
  dataTexto,
  agendamento,
  quantidadeNoDia = 0,
  onFechar,
  onConcluido
}: Props) {
  const [motivo, setMotivo] = useState('')
  const [bloquear, setBloquear] = useState(modo === 'dia')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [avisar, setAvisar] = useState<ClienteAvisar[] | null>(null)

  async function confirmar() {
    setEnviando(true)
    setErro(null)

    try {
      if (modo === 'um' && agendamento) {
        const resposta = await api.patch(`/agendamentos/${agendamento.Id}/cancelar`, {
          origem: 'CLINICA',
          motivo: motivo.trim() || undefined,
          bloquearHorario: bloquear
        })
        setAvisar([{ ...resposta.data.cliente, horario: agendamento.HoraInicio }])
      } else {
        const resposta = await api.post('/agendamentos/cancelar-dia', {
          data,
          motivo: motivo.trim() || undefined,
          bloquearDia: bloquear
        })
        setAvisar(resposta.data.clientes)
      }

      onConcluido()
    } catch (error) {
      setErro(
        axios.isAxiosError(error) && error.response?.data?.mensagem
          ? error.response.data.mensagem
          : 'Não foi possível cancelar. Tente novamente.'
      )
    } finally {
      setEnviando(false)
    }
  }

  function mensagemWhatsApp(cliente: ClienteAvisar) {
    const primeiroNome = cliente.nome.split(' ')[0]
    return (
      `Olá, ${primeiroNome}! Infelizmente precisamos cancelar seu horário de ${dataTexto}` +
      (cliente.horario ? ` às ${cliente.horario}` : '') +
      (motivo.trim() ? ` (${motivo.trim()})` : '') +
      '. Pedimos desculpas! Podemos remarcar para outro dia?'
    )
  }

  return (
    <div className="cancelar-overlay" onClick={onFechar}>
      <div className="cancelar-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <button type="button" className="cancelar-fechar" aria-label="Fechar" onClick={onFechar}>
          <FiX />
        </button>

        {/* ---------- Resultado: avisar as clientes ---------- */}
        {avisar ? (
          <>
            <div className="cancelar-sucesso">
              <FiCheckCircle aria-hidden="true" />
              <h2>{modo === 'dia' ? 'Dia cancelado' : 'Agendamento cancelado'}</h2>
            </div>

            {avisar.length === 0 ? (
              <p>Não havia atendimentos marcados neste dia.{bloquear && ' O dia foi bloqueado na agenda.'}</p>
            ) : (
              <>
                <p>
                  {modo === 'dia' && bloquear && 'O dia foi bloqueado na agenda. '}
                  {avisar.length === 1
                    ? 'Se a cliente usa o app, ela já recebeu o aviso. Para garantir, avise também pelo WhatsApp:'
                    : 'As clientes que usam o app já receberam o aviso. Para garantir, avise também pelo WhatsApp:'}
                </p>

                <ul className="cancelar-lista">
                  {avisar.map(cliente => (
                    <li key={cliente.nome + cliente.horario}>
                      <div>
                        <strong>{cliente.nome}</strong>
                        {cliente.horario && <span>{cliente.horario}</span>}
                      </div>
                      {cliente.telefone ? (
                        <a
                          className="cancelar-whatsapp"
                          href={linkWhatsApp(cliente.telefone, mensagemWhatsApp(cliente))}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <FiMessageCircle aria-hidden="true" /> Avisar
                        </a>
                      ) : (
                        <span className="cancelar-sem-telefone">Sem telefone</span>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}

            <button type="button" className="cancelar-btn-secundario" onClick={onFechar}>
              Concluir
            </button>
          </>
        ) : (
          /* ---------- Formulário ---------- */
          <>
            <h2>{modo === 'dia' ? 'Cancelar todos do dia' : 'Cancelar agendamento'}</h2>

            {modo === 'um' && agendamento ? (
              <p className="cancelar-resumo">
                <strong>{agendamento.Cliente}</strong> · {agendamento.Servico}<br />
                {dataTexto} · {agendamento.HoraInicio} às {agendamento.HoraFim}
              </p>
            ) : (
              <p className="cancelar-alerta">
                <FiAlertTriangle aria-hidden="true" />
                <span>
                  Isso vai cancelar <strong>{quantidadeNoDia} {quantidadeNoDia === 1 ? 'agendamento' : 'agendamentos'}</strong> de {dataTexto}.
                  Nenhuma cliente paga multa.
                </span>
              </p>
            )}

            <label className="cancelar-rotulo" htmlFor="motivo-cancelamento">
              Motivo <span>(aparece no aviso para a cliente)</span>
            </label>
            <div className="cancelar-chips">
              {MOTIVOS_RAPIDOS.map(m => (
                <button
                  type="button"
                  key={m}
                  className={motivo === m ? 'ativo' : ''}
                  onClick={() => setMotivo(motivo === m ? '' : m)}
                >
                  {m}
                </button>
              ))}
            </div>
            <textarea
              id="motivo-cancelamento"
              className="cancelar-textarea"
              rows={2}
              maxLength={500}
              placeholder="Ou escreva o motivo (opcional)"
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
            />

            {modo === 'um' ? (
              <fieldset className="cancelar-opcoes">
                <legend>Depois de cancelar, o horário:</legend>
                <label>
                  <input type="radio" name="bloquear" checked={!bloquear} onChange={() => setBloquear(false)} />
                  Fica livre para outra cliente agendar
                </label>
                <label>
                  <input type="radio" name="bloquear" checked={bloquear} onChange={() => setBloquear(true)} />
                  Fica bloqueado (ninguém agenda)
                </label>
              </fieldset>
            ) : (
              <label className="cancelar-check">
                <input type="checkbox" checked={bloquear} onChange={e => setBloquear(e.target.checked)} />
                Bloquear o dia inteiro na agenda (ninguém consegue agendar)
              </label>
            )}

            {erro && <p className="cancelar-erro">{erro}</p>}

            <div className="cancelar-acoes">
              <button type="button" className="cancelar-btn-secundario" disabled={enviando} onClick={onFechar}>
                Voltar
              </button>
              <button type="button" className="cancelar-btn-perigo" disabled={enviando} onClick={confirmar}>
                {enviando ? 'Cancelando…' : modo === 'dia' ? 'Cancelar o dia' : 'Cancelar agendamento'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
