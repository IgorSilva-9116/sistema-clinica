import { useEffect, useState } from 'react'

// Services
import { clienteService } from '../services/clienteService'
import { profissionalService } from '../services/profissionalService'
import { servicoService } from '../services/servicoService'
import { api } from '../services/api'
import { agendamentoService } from '../services/agendamentoService'
import '../styles/novoAgendamento.css'

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

  useEffect(() => {

    if (!erro && !sucesso) return

    const timer = setTimeout(() => {

      setErro(null)
      setSucesso(false)

    }, 5000)

    return () => clearTimeout(timer)

  }, [erro, sucesso])

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

      if (err.response?.status === 409) {

        const entrar = confirm(
          'Este horário já possui um agendamento.\n\nDeseja adicionar o cliente à lista de espera para esta data e horário?'
        )

        if (entrar) {

          try {

            await api.post('/lista-espera', {
              clienteId: form.clienteId,
              servicoId: form.servicoId,
              dataAgendamento: form.dataAgendamento,
              horaDesejada: form.horaInicio
            })

            alert(
              'Cliente adicionado à lista de espera com sucesso.'
            )

            setForm({
              clienteId: 0,
              profissionalId: 0,
              servicoId: 0,
              dataAgendamento: '',
              horaInicio: '',
            })

            setHorarios([])

          } catch (err: any) {

            setErro(
              err.response?.data?.mensagem ||
              'Erro ao entrar na lista de espera'
            )

          }

        }

      } else {

        setErro(
          err.response?.data?.mensagem ||
          'Erro ao criar agendamento'
        )

      }

    } finally {

      setLoading(false)

    }
  }

  // ==============================
  // RENDER
  // ==============================

  return (
    <div className="novo-agendamento-container">

      <h1>Novo Agendamento</h1>

      <p className="novo-agendamento-subtitulo">
        Cadastre um novo atendimento para um cliente.
      </p>

      {erro && (
        <div className="novo-agendamento-erro">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="novo-agendamento-sucesso">
          Agendamento criado com sucesso!
        </div>
      )}

      <div className="novo-agendamento-card">

        <div className="card-titulo">
          Dados do Agendamento
        </div>

        <div className="card-subtitulo">
          Selecione cliente, profissional, serviço e horário.
        </div>

        <form
          onSubmit={handleSubmit}
          className="novo-agendamento-form"
        >

          <div className="campo">
            <label>Cliente</label>

            <select
              name="clienteId"
              value={form.clienteId}
              onChange={handleChange}
              required
            >
              <option value={0}>
                Selecione o cliente
              </option>

              {clientes.map(c => (
                <option
                  key={c.id}
                  value={c.id}
                  disabled={c.ativo !== 'Ativo'}
                >
                  {c.nome}
                  {c.ativo !== 'Ativo'
                    ? ' (Inativo)'
                    : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="campo">
            <label>Profissional</label>

            <select
              name="profissionalId"
              value={form.profissionalId}
              onChange={handleChange}
              required
            >
              <option value={0}>
                Selecione o profissional
              </option>

              {profissionais.map(p => (
                <option
                  key={p.id}
                  value={p.id}
                >
                  {p.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="campo">
            <label>Serviço</label>

            <select
              name="servicoId"
              value={form.servicoId}
              onChange={handleChange}
              required
            >
              <option value={0}>
                Selecione o serviço
              </option>

              {servicos.map(s => (
                <option
                  key={s.id}
                  value={s.id}
                >
                  {s.titulo}
                </option>
              ))}
            </select>
          </div>

          <div className="linha-campos">

            <div className="campo">
              <label>Data</label>

              <input
                type="date"
                name="dataAgendamento"
                value={form.dataAgendamento}
                onChange={handleChange}
                required
              />
            </div>

            <div className="campo">
              <label>Horário</label>

              <select
                name="horaInicio"
                value={form.horaInicio}
                onChange={handleChange}
                required
              >
                <option value="">
                  Selecione o horário
                </option>

                {horarios.map(h => (
                  <option
                    key={h}
                    value={h}
                  >
                    {h}
                  </option>
                ))}
              </select>
              {form.dataAgendamento &&
                horarios.length === 0 && (
                  <div className="aviso-horario">
                    Nenhum horário disponível para esta data.
                  </div>
                )}
            </div>

          </div>
          <div className="acoes-formulario">
            <button
              type="submit"
              disabled={loading}
              className="btn-salvar-agendamento"
            >
              {loading
                ? 'Salvando...'
                : 'Salvar Agendamento'}
            </button>
          </div>

        </form>

      </div>

    </div>
  )
}
