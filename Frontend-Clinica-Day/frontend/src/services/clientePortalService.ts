import { api } from './api'
import type { Usuario } from '../contexts/AuthContext'

export interface ServicoPublico {
  id: number
  titulo: string
  descricao?: string | null
  preco: number
  duracaoMinutos: number
  categoria?: string | null
}

export interface ClinicaPublica {
  nome: string
  telefone?: string | null
  slug: string
  politicaAgendamento?: string | null
}

export interface PerfilCliente {
  nome: string
  email?: string | null
  telefone: string
  sexo?: string | null
  dataNascimento?: string | null
  clinicaNome: string
  clinicaSlug: string
  clinicaTelefone?: string | null
}

export interface ConviteCliente {
  nome: string
  email?: string | null
  telefone?: string | null
  clinica: string
  precisaDataNascimento: boolean
}

interface SessaoResponse {
  token: string
  usuario: Usuario
  slug?: string
}

export const clientePortalService = {
  async obterClinica(slug: string) {
    const response = await api.get<{ clinica: ClinicaPublica; servicos: ServicoPublico[] }>(
      `/publico/clinicas/${slug}`
    )
    return response.data
  },

  async cadastrar(slug: string, dados: {
    nome: string
    email?: string
    telefone: string
    dataNascimento: string
    senha: string
  }) {
    const response = await api.post<SessaoResponse>(`/publico/clinicas/${slug}/cadastro`, dados)
    return response.data
  },

  async obterConvite(token: string) {
    const response = await api.get<ConviteCliente>(
      `/publico/convites/${token}`
    )
    return response.data
  },

  async ativarConvite(token: string, senha: string, dataNascimento?: string) {
    const response = await api.post<SessaoResponse>('/publico/convites/ativar', { token, senha, dataNascimento })
    return response.data
  },

  async obterPerfil() {
    const response = await api.get<{ perfil: PerfilCliente }>('/cliente/perfil')
    return response.data.perfil
  },

  async atualizarPerfil(dados: {
    nome: string
    telefone: string
    sexo?: string | null
    dataNascimento?: string | null
  }) {
    await api.put('/cliente/perfil', dados)
  },

  async alterarSenha(senhaAtual: string, novaSenha: string) {
    await api.put('/cliente/senha', { senhaAtual, novaSenha })
  },

  // ---------- Agendamento online ----------

  async obterConfiguracaoAgenda() {
    const response = await api.get<ConfiguracaoAgenda>('/cliente/agenda/configuracao')
    return response.data
  },

  // remarcarId: na remarcação, o horário atual da cliente não conta como ocupado
  async listarDias(servicoIds: number[], remarcarId?: number) {
    const response = await api.get<{ dias: DiaAgenda[] }>('/cliente/agenda/dias', {
      params: { servicoIds: servicoIds.join(','), remarcar: remarcarId }
    })
    return response.data.dias
  },

  async listarHorarios(servicoIds: number[], data: string, remarcarId?: number) {
    const response = await api.get<{ horarios: string[] }>('/cliente/agenda/horarios', {
      params: { servicoIds: servicoIds.join(','), data, remarcar: remarcarId }
    })
    return response.data.horarios
  },

  async agendar(dados: { servicoIds: number[]; data: string; horaInicio: string }) {
    const response = await api.post<{ agendamento: AgendamentoCriado }>('/cliente/agendamentos', dados)
    return response.data.agendamento
  },

  // ---------- Meus agendamentos ----------

  async listarAtendimentos() {
    const response = await api.get<{ proximos: Atendimento[]; historico: Atendimento[] }>('/cliente/agendamentos')
    return response.data
  },

  async cancelarAtendimento(id: number) {
    const response = await api.post<{ mensagem: string; valorMulta: number }>(`/cliente/agendamentos/${id}/cancelar`, {})
    return response.data
  },

  async remarcarAtendimento(id: number, dados: { data: string; horaInicio: string }) {
    const response = await api.post<{ agendamento: Omit<AgendamentoCriado, 'grupo' | 'valorTotal' | 'status'> }>(
      `/cliente/agendamentos/${id}/remarcar`,
      dados
    )
    return response.data.agendamento
  },

  // ---------- Avisos ----------

  async listarNotificacoes() {
    const response = await api.get<{ naoLidas: number; notificacoes: Notificacao[] }>('/cliente/notificacoes')
    return response.data
  },

  async marcarNotificacoesLidas() {
    await api.post('/cliente/notificacoes/lidas')
  }
}

export type StatusAtendimento = 'CRIADO' | 'CONFIRMADO' | 'CANCELADO' | 'FINALIZADO'

export interface Atendimento {
  id: number
  data: string
  horaInicio: string
  horaFim: string
  status: StatusAtendimento
  valorTotal: number
  valorMulta: number
  canceladoPor: 'CLIENTE' | 'CLINICA' | null
  motivoCancelamento: string | null
  proximo: boolean
  podeCancelar: boolean
  podeRemarcar: boolean
  multaSeCancelar: { percentual: number; valor: number } | null
  servicos: {
    id: number
    servicoId: number
    titulo: string
    horaInicio: string
    horaFim: string
    valor: number
    status: StatusAtendimento
  }[]
}

export interface Notificacao {
  id: number
  tipo: string
  titulo: string
  mensagem: string
  lida: boolean
  criadaEm: string
}

export interface ConfiguracaoAgenda {
  agendaLiberada: boolean
  dataMinima: string | null
  dataMaxima: string | null
  politicaAgendamento?: string | null
  maxServicos: number
  janelaCancelamentoHoras: number
  multaPercentual: number
}

export interface DiaAgenda {
  data: string
  livres: number
}

export interface AgendamentoCriado {
  grupo: string | null
  data: string
  horaInicio: string
  horaFim: string
  valorTotal: number
  status: string
  servicos: { titulo: string; horaInicio: string; horaFim: string; valor: number }[]
}

// "2026-10-06" -> Date local (sem pular de dia por fuso)
export function dataLocal(dataISO: string) {
  const [ano, mes, dia] = dataISO.split('-').map(Number)
  return new Date(ano, mes - 1, dia)
}

// "Terça-feira, 6 de outubro"
export function dataPorExtenso(dataISO: string) {
  const texto = dataLocal(dataISO).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

// 105 -> "1h45", 60 -> "1h", 40 -> "40 min"
export function formatarDuracao(minutos: number) {
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  if (h === 0) return `${m} min`
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`
}

export function formatarPreco(valor: number) {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// Mesma regra do back-end (utils/senhaCliente.js)
export function senhaClienteValida(senha: string) {
  return senha.length >= 8 && /[A-Za-z]/.test(senha) && /\d/.test(senha)
}

export const MENSAGEM_SENHA_CLIENTE =
  'A senha deve ter no mínimo 8 caracteres, com letras e números'

// Link de WhatsApp a partir de um telefone brasileiro
export function linkWhatsApp(telefone?: string | null, texto?: string) {
  const numero = (telefone || '').replace(/\D/g, '')
  const comDdi = numero.startsWith('55') ? numero : `55${numero}`
  const mensagem = texto ? `?text=${encodeURIComponent(texto)}` : ''
  return `https://wa.me/${comDdi}${mensagem}`
}

// "32988887777" -> "(32) 98888-7777"
export function formatarTelefone(telefone?: string | null) {
  const d = (telefone || '').replace(/\D/g, '')
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return telefone || ''
}

// Guarda a clínica da cliente para os links de "voltar" e "sair"
export function salvarSlugClinica(slug?: string | null) {
  if (slug) localStorage.setItem('clinicaSlug', slug)
}

export function obterSlugClinica() {
  return localStorage.getItem('clinicaSlug')
}
