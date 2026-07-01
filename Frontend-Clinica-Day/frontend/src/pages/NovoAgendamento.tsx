import { useEffect, useState } from 'react'

// Services
import { clienteService } from '../services/clienteService'
import { profissionalService } from '../services/profissionalService'
import { servicoService } from '../services/servicoService'
import { api } from '../services/api'
import { agendamentoService } from '../services/agendamentoService'

// Types
import type { Cliente } from '../types/Cliente'
import type { Profissional } from '../types/Profissional'
import type { Servico } from '../types/Servico'

export function NovoAgendamento() {

  // ==============================
  // ESTADOS BASE
  // ==============================

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [servicos, setServicos] = useState<Servico[]>([])
  const [horarios, setHorarios] = useState<string[]>([])

  // ==============================
  // ESTADO DO FORMULÁRIO (SEM clinicaId)
  // ==============================

  const [form, setForm] = useState({
    clienteId: 0,
    profissionalId: 0,
    servicoId: 0,
    dataAgendamento: '',
    horaInicio: '',
  })

  // ==============================
  // UX
  // ==============================

  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)

  // ==============================
  // CARGA INICIAL
  // ==============================

  useEffect(() => {
    async function carregarDados() {
      try {
        const [
          clientesResp,
          profissionaisResp,
          servicosResp
        ] = await Promise.all([
          clienteService.listar(),
          profissionalService.listar(),
          servicoService.listar()
        ])

        setClientes(clientesResp.clientes)
        setProfissionais(profissionaisResp.profissionais)
        setServicos(servicosResp.servicos)

      } catch {
        setErro('Erro ao carregar dados iniciais')
      }
    }

    carregarDados()
  }, [])

  // ==============================
  // QUANDO MUDA PROFISSIONAL
  // ==============================

  useEffect(() => {
    async function carregarServicos() {
      if (!form.profissionalId) return

      try {
        const response = await servicoService.listar()
        setServicos(response.servicos)
      } catch {
        setErro('Erro ao carregar serviços')
      }
    }

    carregarServicos()
  }, [form.profissionalId])

  // ==============================
  // QUANDO MUDA DATA / SERVIÇO / PROFISSIONAL
  // ==============================

 useEffect(() => {
  async function carregarHorarios() {
    const { servicoId, dataAgendamento } = form

    if (!servicoId || !dataAgendamento) {
      setHorarios([])
      return
    }

    try {
      const response = await api.get('/agenda/disponibilidade', {
        params: {
          data: dataAgendamento,
          servicoId,
        },
      })

      setHorarios(response.data?.horariosDisponiveis ?? [])
      setErro(null)
    } catch {
      setHorarios([])
      setErro('Erro ao buscar horários disponíveis')
    }
  }

  carregarHorarios()
}, [form.servicoId, form.dataAgendamento])

  // ==============================
  // HANDLERS
  // ==============================

  function handleChange(
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) {
    const { name, value } = e.target

    setForm(prev => ({
      ...prev,
      [name]: ['clienteId', 'profissionalId', 'servicoId'].includes(name)
        ? Number(value)
        : value,
    }))
  }

  // ✅ SUBMIT CORRIGIDO (FLUXO DA CLÍNICA)
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    setLoading(true)
    setErro(null)
    setSucesso(false)

    try {
      await agendamentoService.criarClinica({
        clienteId: form.clienteId,
        profissionalId: form.profissionalId,
        servicoId: form.servicoId,
        dataAgendamento: form.dataAgendamento,
        horaInicio: form.horaInicio
      })

      setSucesso(true)

      setForm({
        clienteId: 0,
        profissionalId: 0,
        servicoId: 0,
        dataAgendamento: '',
        horaInicio: '',
      })

      setHorarios([])

    } catch (err: any) {

  // ✅ CASO CONFLITO (continua igual)
  if (err.response?.status === 409) {
    const entrar = confirm(
      err.response?.data?.mensagem ||
      'Horário indisponível. Deseja entrar na lista de espera?'
    )

    if (entrar) {
      try {
        await api.post('/lista-espera', {
          clienteId: form.clienteId,
          servicoId: form.servicoId,
          dataAgendamento: form.dataAgendamento,
          horaDesejada: form.horaInicio
        })

        alert('Cliente entrou na lista de espera')

      } catch (err: any) {

        if (err.response?.data?.mensagem) {
          alert(err.response.data.mensagem)
        } else {
          alert('Erro ao entrar na lista')
        }

      }
    }

  } else {

    // ✅ 🔥 AQUI ESTÁ A CORREÇÃO PRINCIPAL
    if (err.response?.data?.mensagem) {
      setErro(err.response.data.mensagem)
    } else {
      setErro('Erro ao criar agendamento')
    }

  }
}


  }

  // ==============================
  // RENDER
  // ==============================

  return (
    <div>
      <h2>Novo Agendamento</h2>

      {erro && <p>{erro}</p>}
      {sucesso && <p>Agendamento criado com sucesso!</p>}

      <form onSubmit={handleSubmit}>

        <select name="clienteId" value={form.clienteId} onChange={handleChange} required>
          <option value={0}>Selecione o cliente</option>
          {clientes.map(c => (
            <option key={c.id} value={c.id} disabled={c.ativo !== 'Ativo'} > {c.nome} {c.ativo !== 'Ativo' ? '(Inativo)' : ''}
            </option>
           
          ))}
        </select>


        <select name="profissionalId" value={form.profissionalId} onChange={handleChange} required>
          <option value={0}>Selecione o profissional</option>
          {profissionais.map(p => (
            <option key={p.id} value={p.id}>{p.nome}</option>
          ))}
        </select>

        <select name="servicoId" value={form.servicoId} onChange={handleChange} required>
          <option value={0}>Selecione o serviço</option>
          {servicos.map(s => (
            <option key={s.id} value={s.id}>{s.titulo}</option>
          ))}
        </select>

        <input
          type="date"
          name="dataAgendamento"
          value={form.dataAgendamento}
          onChange={handleChange}
          required
        />

        <select
          name="horaInicio"
          value={form.horaInicio}
          onChange={handleChange}
          required
        >
          <option value="">Selecione o horário</option>
          {horarios.map(h => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>

        <button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
      </form>
    </div>
  )
}
