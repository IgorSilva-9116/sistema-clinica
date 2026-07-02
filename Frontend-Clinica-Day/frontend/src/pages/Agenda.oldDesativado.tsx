// import { useEffect, useState, useCallback } from 'react'
// import { api } from '../services/api'

// type DiaAgendaBase = {
//   id: number
//   diaSemana: number
//   horaInicio: string
//   horaFim: string
//   ativo: boolean
// }

// type EdicaoDia = {
//   inicio: string
//   fim: string
//   alterado: boolean
// }

// const diasSemana = [
//   'Domingo',
//   'Segunda-feira',
//   'Terça-feira',
//   'Quarta-feira',
//   'Quinta-feira',
//   'Sexta-feira',
//   'Sábado'
// ]

// export default function AgendaBase() {
//   const [agendaBase, setAgendaBase] = useState<DiaAgendaBase[]>([])
//   const [loading, setLoading] = useState(false)
//   const [erro, setErro] = useState<string | null>(null)
//   const [mensagem, setMensagem] = useState<string | null>(null)
//   const [edicao, setEdicao] = useState<Record<number, EdicaoDia>>({})

//   /**
//    * ✅ Carrega agenda base (NÃO limpa mensagem)
//    */
//   const carregarAgendaBase = useCallback(async () => {
//     setLoading(true)
//     setErro(null)

//     try {
//       const resp = await api.get('/agenda/base')
//       const dados: DiaAgendaBase[] = resp.data?.agenda ?? []
//       setAgendaBase(dados)

//       const estadoEdicao: Record<number, EdicaoDia> = {}
//       dados.forEach(d => {
//         estadoEdicao[d.id] = {
//           inicio: d.horaInicio,
//           fim: d.horaFim,
//           alterado: false
//         }
//       })
//       setEdicao(estadoEdicao)
//     } catch {
//       setErro('Não foi possível carregar a agenda base.')
//     } finally {
//       setLoading(false)
//     }
//   }, [])

//   /**
//    * ✅ Abrir dia
//    */
//   async function ativarDia(id: number, nomeDia: string) {
//     try {
//       await api.patch(`/agenda/base/${id}/ativar-dia`)
//       setMensagem(`✅ A clínica agora funciona na ${nomeDia}.`)
//       carregarAgendaBase()
//     } catch {
//       setMensagem(
//         '❗ Não foi possível abrir este dia agora. Tente novamente.'
//       )
//     }
//   }

//   /**
//    * ✅ Fechar dia (com proteção)
//    */
//   async function desativarDia(id: number, nomeDia: string) {
//     if (edicao[id]?.alterado) {
//       setMensagem('⚠️ Salve o horário antes de fechar este dia.')
//       return
//     }

//     try {
//       await api.patch(`/agenda/base/${id}/desativar-dia`)
//       setMensagem(`❌ A clínica não funciona mais na ${nomeDia}.`)
//       carregarAgendaBase()
//     } catch {
//       setMensagem(
//         '❗ Não foi possível fechar este dia agora. Verifique se não há configurações pendentes.'
//       )
//     }
//   }

//   /**
//    * ✅ Marca horário como alterado (não salva ainda)
//    */
//   function alterarHorario(
//     id: number,
//     campo: 'inicio' | 'fim',
//     valor: string
//   ) {
//     setEdicao(prev => ({
//       ...prev,
//       [id]: {
//         ...prev[id],
//         [campo]: valor,
//         alterado: true
//       }
//     }))
//   }

//   /**
//    * ✅ Salva horário explicitamente
//    */
//   async function salvarHorario(id: number, nomeDia: string) {
//     const horario = edicao[id]

//     try {
//       await api.put(`/agenda/base/${id}`, {
//         horaInicio: horario.inicio,
//         horaFim: horario.fim
//       })
//       setMensagem(`✅ Horário da ${nomeDia} salvo com sucesso.`)
//       carregarAgendaBase()
//     } catch {
//       setMensagem('❗ Erro ao salvar o horário. Tente novamente.')
//     }
//   }

//   useEffect(() => {
//     carregarAgendaBase()
//   }, [carregarAgendaBase])

//   return (
//     <div style={{ maxWidth: 600 }}>
//       <h1>Horário semanal da clínica</h1>
//       <p>
//         Defina os dias e horários em que a clínica normalmente funciona.
//         Essas configurações valem para todas as semanas.
//       </p>

//       {loading && <p>Carregando...</p>}
//       {erro && <p style={{ color: 'red' }}>{erro}</p>}
//       {mensagem && <p style={{ color: 'green' }}>{mensagem}</p>}

//       {!loading &&
//         agendaBase.map(dia => {
//           const ed = edicao[dia.id]
//           const nomeDia = diasSemana[dia.diaSemana].toLowerCase()

//           return (
//             <div key={dia.id} style={{ marginBottom: 28 }}>
//               <h3>{diasSemana[dia.diaSemana]}</h3>

//               {!dia.ativo && (
//                 <>
//                   <p>❌ A clínica não funciona neste dia.</p>
//                   <button onClick={() => ativarDia(dia.id, nomeDia)}>
//                     Abrir este dia
//                   </button>
//                 </>
//               )}

//               {dia.ativo && ed && (
//                 <>
//                   <p>✅ A clínica funciona neste dia.</p>

//                   <label>
//                     Início:{' '}
//                     <input
//                       type="time"
//                       value={ed.inicio}
//                       onChange={e =>
//                         alterarHorario(
//                           dia.id,
//                           'inicio',
//                           e.target.value
//                         )
//                       }
//                     />
//                   </label>

//                   <br />

//                   <label>
//                     Fim:{' '}
//                     <input
//                       type="time"
//                       value={ed.fim}
//                       onChange={e =>
//                         alterarHorario(
//                           dia.id,
//                           'fim',
//                           e.target.value
//                         )
//                       }
//                     />
//                   </label>

//                   {ed.alterado && (
//                     <p style={{ color: 'orange' }}>
//                       ⚠️ Você alterou o horário. Clique em
//                       <strong> Salvar horário </strong>
//                       para confirmar.
//                     </p>
//                   )}

//                   <button
//                     disabled={!ed.alterado}
//                     onClick={() =>
//                       salvarHorario(dia.id, nomeDia)
//                     }
//                   >
//                     Salvar horário
//                   </button>

//                   <button
//                     style={{ marginLeft: 10 }}
//                     onClick={() =>
//                       desativarDia(dia.id, nomeDia)
//                     }
//                   >
//                     Fechar este dia
//                   </button>
//                 </>
//               )}
//             </div>
//           )
//         })}
//     </div>
//   )
// }




