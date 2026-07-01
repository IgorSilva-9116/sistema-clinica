import { Routes, Route, Navigate } from 'react-router-dom'
import { PrivateRoute } from './PrivateRoute'
import { MainLayout } from '../components/layout/MainLayout'

// Pages
import { Login } from '../pages/Login'
import { Home } from '../pages/Home'
import { Clientes } from '../pages/Clientes'
import { NovoCliente } from '../pages/NovoCliente'
import { Servicos } from '../pages/Servicos'
import { NovoServico } from '../pages/NovoServico'
import { EditarServico } from '../pages/EditarServico'
import AgendaCalendario from '../pages/AgendaCalendario'
import { NovoAgendamento } from '../pages/NovoAgendamento'
import { AcessoNegado } from '../pages/AcessoNegado'
import AgendaBase from '../pages/AgendaBase'
import GerenciarExcecoes from '../pages/GerenciarExcecoes'
import PoliticaCancelamento from '../pages/PoliticaCancelamento'
import { PoliticaAgendamento } from '../pages/PoliticaAgendamento'
import { Usuarios } from '../pages/Usuarios'
import { NovoUsuario } from '../pages/NovoUsuario'
import ResetarSenha from '../pages/ResetarSenha'
import AlterarSenha from '../pages/AlterarSenha'
import { ListaEspera } from '../pages/ListaEspera'
import DespesaPage from '../pages/Despesa'


// Relatórios
import Relatorios from '../pages/Relatorios'
import RelatorioClientes from '../pages/RelatorioClientes'

export function AppRoutes() {
  return (
    <Routes>
      {/* Rota pública */}
      <Route path="/login" element={<Login />} />
     
       

      {/* ✅ RESETAR SENHA */}
      <Route path="/resetar-senha" element={<ResetarSenha />} />
      <Route path="/alterar-senha" element={<AlterarSenha />} /> 

      {/* ✅ REDIRECT DE URL ANTIGA */}
      <Route
        path="/agenda/base"
        element={<Navigate to="/configurar-agenda" replace />}
      />
      
      
      {/* Rotas protegidas */}
      <Route
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route path="/" element={<Home />} />

        {/* 📅 AGENDA */}
        <Route path="/agenda" element={<AgendaCalendario />} />
        <Route path="/agendamentos/novo" element={<NovoAgendamento />} />
         

          {/* LISTA DE ESPERA */} 
        <Route path="/lista-espera" element={<ListaEspera />} />
        
          {/* DESPESAS */} 
        <Route path="/despesas" element={<DespesaPage />} />


        {/* ⚙️ CONFIGURAÇÕES */}
        <Route path="/configurar-agenda" element={<AgendaBase />} />
        <Route path="/excecoes/gerenciar" element={<GerenciarExcecoes />} />
        <Route path="/politica-cancelamento" element={<PoliticaCancelamento />}/>
        <Route path="/politica-agendamento" element={<PoliticaAgendamento/>}/>

        {/* 👥 CLIENTES */}
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/clientes/novo" element={<NovoCliente />} />
        <Route path="/clientes/editar/:id" element={<NovoCliente />} />

        {/* 👥 USUARIOS */}
        <Route path="/usuarios" element={<Usuarios />} />
        <Route path="/usuarios/novo" element={<NovoUsuario />} />
        <Route path="/usuarios/editar/:id" element={<NovoUsuario />} />

        {/* 🛠️ SERVIÇOS */}
        <Route path="/servicos" element={<Servicos />} />
        <Route path="/servicos/novo" element={<NovoServico />} />
        <Route path="/servicos/editar/:id" element={<EditarServico />} />

        {/* 📊 RELATÓRIOS (AGRUPADOS) */}
        <Route path="/relatorios">
          {/* Página principal de relatórios (Resumo financeiro) */}
          <Route index element={<Relatorios />} />

          {/* Sub-relatórios */}
          <Route path="clientes" element={<RelatorioClientes />} />
        </Route>

        {/* 🚫 ACESSO NEGADO */}
        <Route path="/acesso-negado" element={<AcessoNegado />} />
      </Route>
    </Routes>
  )
}