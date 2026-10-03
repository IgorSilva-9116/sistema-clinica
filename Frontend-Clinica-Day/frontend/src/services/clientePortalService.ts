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
  }
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
