  // import { useEffect, useState, useCallback } from 'react'
  // import { api } from '../services/api'
  // import axios from 'axios'

  // /* =======================
  //   TIPOS
  //   ======================= */

  // type Agendamento = {
  //   Id: number
  //   HoraInicio: string
  //   HoraFim: string
  //   Servico: string
  //   Cliente: string
  //   Status: 'AGENDADO' | 'CANCELADO'
  // }

  // type ExcecaoAgenda = {
  //   Id: number
  //   HoraInicio: string
  //   HoraFim: string
  //   TipoExcecao: 'ABRIR' | 'FECHAR'
  //   Observacao?: string
  // }

  // /**
  //  * Union discriminado para segurança total
  //  */
  // type SlotAgenda =
  //   | {
  //       hora: string
  //       status: 'LIVRE'
  //     }
  //   | {
  //       hora: string
  //       status: 'AGENDADO'
  //       agendamento: Agendamento
  //     }
  //   | {
  //       hora: string
  //       status: 'CANCELADO'
  //       agendamento: Agendamento
  //     }

  //     /* =======================
  //   COMPONENTE
  //   ======================= */

  // export default function Agenda() {
  //   const hoje = new Date().toISOString().split('T')[0]

  //   const [data, setData] = useState(hoje)
  //   const [slots, setSlots] = useState<SlotAgenda[]>([])
  //   const [excecoes, setExcecoes] = useState<ExcecaoAgenda[]>([])
  //   const [loading, setLoading] = useState(false)
  //   const [erro, setErro] = useState<string | null>(null)
  //   const [diaAberto, setDiaAberto] = useState<boolean | null>(null)

  //   /**
  //    * ✅ Função única que carrega TODA a agenda do dia
  //    * (agendamentos + disponibilidade + exceções visuais)
  //    */
  //   const carregarAgenda = useCallback(async () => {
  //     setLoading(true)
  //     setErro(null)
  //     setDiaAberto(null)
  //     setSlots([])
  //     setExcecoes([])

  //     try {
  //       /* =======================
  //         1️⃣ Buscar agendamentos
  //         ======================= */
  //       let agendamentos: Agendamento[] = []

  //       try {
  //         const agendaResp = await api.get('/agendamentos', {
  //           params: { data }
  //         })
  //         agendamentos = agendaResp.data?.agendamentos ?? []
  //       } catch (e) {
  //         console.error('Erro ao buscar agendamentos:', e)
  //         // Não aborta – agenda pode existir mesmo sem agendamentos
  //       }

  //       /* =======================
  //         2️⃣ Buscar disponibilidade
  //         (backend já aplica exceções)
  //         ======================= */
  //       const dispResp = await api.get('/agenda/disponibilidade', {
  //         params: { data, servicoId: 1 } // serviço padrão por enquanto
  //       })

  //       const aberto: boolean = dispResp.data?.aberto ?? true
  //       const horarios: string[] =
  //         dispResp.data?.horariosDisponiveis ?? []

  //       setDiaAberto(aberto)

  //       /* =======================
  //         3️⃣ Buscar exceções
  //         (somente para exibição)
  //         ======================= */
  //       const excecaoResp = await api.get('/agenda/excecao', {
  //         params: { data }
  //       })
  //       setExcecoes(excecaoResp.data?.excecoes ?? [])

  //       if (!aberto) {
  //         setLoading(false)
  //         return
  //       }

  //       /* =======================
  //         4️⃣ Montar linha do tempo
  //         ======================= */
  //       const slotsMontados: SlotAgenda[] = horarios.map(hora => {
  //         const agendamento = agendamentos.find(
  //           a => a.HoraInicio === hora
  //         )

  //         if (!agendamento) {
  //           return {
  //             hora,
  //             status: 'LIVRE'
  //           }
  //         }

  //         if (agendamento.Status === 'CANCELADO') {
  //           return {
  //             hora,
  //             status: 'CANCELADO',
  //             agendamento
  //           }
  //         }

  //         return {
  //           hora,
  //           status: 'AGENDADO',
  //           agendamento
  //         }
  //       })

  //       setSlots(slotsMontados)
  //     } catch (e) {
  //       console.error(e)
  //       if (axios.isAxiosError(e)) {
  //         setErro('Erro ao carregar a agenda.')
  //       } else {
  //         setErro('Erro inesperado ao carregar a agenda.')
  //       }
  //     } finally {
  //       setLoading(false)
  //     }
  //   }, [data])
  // /**
  //    * ✅ Recarrega a agenda sempre que a data mudar
  //    */
  //   useEffect(() => {
  //     carregarAgenda()
  //   }, [carregarAgenda])

  //   /* =======================
  //     RENDER
  //     ======================= */

  //   return (
  //     <div style={{ maxWidth: 700 }}>
  //       <h1>Agenda</h1>

  //       <label>
  //         Data:{' '}
  //         <input
  //           type="date"
  //           value={data}
  //           onChange={e => setData(e.target.value)}
  //         />
  //       </label>

  //       {loading && <p>Carregando agenda...</p>}

  //       {!loading && erro && (
  //         <p style={{ color: 'red' }}>{erro}</p>
  //       )}

  //       {!loading && !erro && diaAberto === false && (
  //         <p>A clínica não funciona neste dia.</p>
  //       )}

  //       {/* ✅ Exceções aplicadas neste dia */}
  //       {!loading && excecoes.length > 0 && (
  //         <div style={{ marginTop: 20 }}>
  //           <strong>Exceções aplicadas neste dia:</strong>
  //           <ul>
  //             {excecoes.map(ex => (
  //               <li key={ex.Id}>
  //                 {ex.TipoExcecao === 'FECHAR' ? '❌ Fechado' : '✅ Aberto'} —{' '}
  //                 {ex.HoraInicio} até {ex.HoraFim}
  //                 {ex.Observacao && ` (${ex.Observacao})`}
  //               </li>
  //             ))}
  //           </ul>
  //         </div>
  //       )}

  //       {!loading && !erro && diaAberto === true && slots.length === 0 && (
  //         <p>Nenhum horário disponível para este dia.</p>
  //       )}
  //       {!loading && !erro && diaAberto === true && slots.length > 0 && (
  //         <ul style={{ listStyle: 'none', padding: 0 }}>
  //           {slots.map(slot => (
  //             <li key={slot.hora} style={{ marginTop: 10 }}>
  //               <strong>{slot.hora}</strong> — {slot.status}

  //               {'agendamento' in slot && (
  //                 <div style={{ marginLeft: 10 }}>
  //                   {slot.agendamento.Servico} —{' '}
  //                   {slot.agendamento.Cliente}
  //                 </div>
  //               )}
  //             </li>
  //           ))}
  //         </ul>
  //       )}
  //     </div>
  //   )
  // }
