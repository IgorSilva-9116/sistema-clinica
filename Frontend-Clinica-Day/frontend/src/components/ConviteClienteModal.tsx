import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { clienteService } from '../services/clienteService'
import { linkWhatsApp } from '../services/clientePortalService'
import type { Cliente } from '../types/Cliente'

interface Props {
  cliente: Cliente
  onFechar: () => void
  onConviteGerado: () => void
}

interface Convite {
  link: string
  telefone?: string | null
  mensagem: string
}

// Gera o link de acesso ao app e oferece envio pelo WhatsApp
export function ConviteClienteModal({ cliente, onFechar, onConviteGerado }: Props) {
  const [convite, setConvite] = useState<Convite | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)
  const jaGerou = useRef(false)

  useEffect(() => {
    // Cada geração invalida o link anterior: garante uma única chamada
    if (jaGerou.current) return
    jaGerou.current = true

    clienteService.gerarConvite(cliente.id)
      .then(dados => {
        setConvite(dados)
        onConviteGerado()
      })
      .catch(error => {
        setErro(
          axios.isAxiosError(error) && error.response?.data?.mensagem
            ? error.response.data.mensagem
            : 'Não foi possível gerar o acesso'
        )
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliente.id])

  async function copiar() {
    if (!convite) return
    await navigator.clipboard.writeText(convite.mensagem)
    setCopiado(true)
  }

  return (
    <div className="convite-overlay" onClick={onFechar}>
      <div className="convite-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <h2>Acesso ao app — {cliente.nome}</h2>

        {!convite && !erro && <p>Gerando link…</p>}

        {erro && <p className="convite-erro">{erro}</p>}

        {convite && (
          <>
            <p>
              Envie a mensagem abaixo para a cliente. Pelo link ela cria a senha e já entra.
              O link vale por <strong>7 dias</strong> e só pode ser usado uma vez.
            </p>

            <textarea className="convite-mensagem" readOnly value={convite.mensagem} rows={5} />

            <div className="convite-acoes">
              {convite.telefone && (
                <a
                  className="clientes-btn-primary convite-whatsapp"
                  href={linkWhatsApp(convite.telefone, convite.mensagem)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Enviar pelo WhatsApp
                </a>
              )}

              <button type="button" className="clientes-btn-secondary" onClick={copiar}>
                {copiado ? 'Copiado!' : 'Copiar mensagem'}
              </button>
            </div>
          </>
        )}

        <button type="button" className="convite-fechar" onClick={onFechar}>
          Fechar
        </button>
      </div>
    </div>
  )
}
