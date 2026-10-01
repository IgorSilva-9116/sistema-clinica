import { Routes, Route, Navigate } from 'react-router-dom'
import { PrivateRoute } from './PrivateRoute'
import { MainLayout } from '../components/layout/MainLayout'

// Pages
import { Login } from '../pages/Login'
import { Home } from '../pages/Home'
import { Clientes } from '../pages/Clientes'
import { NovoCliente } from '../pages/NovoCliente'
import Aniversariantes from '../pages/Aniversariantes'
import { Servicos } from '../pages/Servicos'
import { NovoServico } from '../pages/NovoServico'
import { EditarServico } from '../pages/EditarServico'
import AgendaCalendario from '../pages/AgendaCalendario'
import { NovoAgendamento } from '../pages/NovoAgendamento'
import { AcessoNegado } from '../pages/AcessoNegado'
import AgendaBase from '../pages/AgendaBase'
import GerenciarExcecoes from '../pages/GerenciarExcecoes'
import Politicas from '../pages/Politicas'
import PoliticaCancelamento from '../pages/PoliticaCancelamento'
import { PoliticaAgendamento } from '../pages/PoliticaAgendamento'
import { Usuarios } from '../pages/Usuarios'
import { NovoUsuario } from '../pages/NovoUsuario'
import ResetarSenha from '../pages/ResetarSenha'
import AlterarSenha from '../pages/AlterarSenha'
import { ListaEspera } from '../pages/ListaEspera'
import DespesaPage from '../pages/Despesa'
import ListaDespesas from '../pages/ListaDespesas'
import { CategoriasServico } from '../pages/CategoriasServico'
import { CategoriasFinanceiras } from '../pages/CategoriasFinanceiras'




// Relatórios
import Relatorios from '../pages/Relatorios'
import DashboardRelatorios from '../pages/DashboardRelatorios'
import FinanceiroRelatorios from '../pages/FinanceiroRelatorios'
import ClientesRelatorios from '../pages/ClientesRelatorios'
import ServicosRelatorios from '../pages/ServicosRelatorios'

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

        <Route path="/despesas/lista" element={<ListaDespesas />} />

        <Route path="/categorias-financeiras" element={<CategoriasFinanceiras />} />


        {/* ⚙️ CONFIGURAÇÕES */}
        <Route path="/configurar-agenda" element={<AgendaBase />} />
        <Route path="/excecoes/gerenciar" element={<GerenciarExcecoes />} />

        {/* POLITICAS */}
        <Route path="/politicas" element={<Politicas />}>

          <Route
            index
            element={<Navigate to="cancelamento" replace />}
          />

          <Route
            path="cancelamento"
            element={<PoliticaCancelamento />}
          />

          <Route
            path="agendamento"
            element={<PoliticaAgendamento />}
          />

        </Route>

        {/* Redirects de URLs antigas, caso ainda existam links apontando pra elas */}
        <Route
          path="/politica-cancelamento"
          element={<Navigate to="/politicas/cancelamento" replace />}
        />
        <Route
          path="/politica-agendamento"
          element={<Navigate to="/politicas/agendamento" replace />}
        />

        {/* 👥 CLIENTES */}
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/clientes/novo" element={<NovoCliente />} />
        <Route path="/clientes/editar/:id" element={<NovoCliente />} />
        <Route path="/clientes/aniversariantes" element={<Aniversariantes />} />

        {/* 👥 USUARIOS */}
        <Route path="/usuarios" element={<Usuarios />} />
        <Route path="/usuarios/novo" element={<NovoUsuario />} />
        <Route path="/usuarios/editar/:id" element={<NovoUsuario />} />

        {/* 🛠️ SERVIÇOS */}
        <Route path="/servicos" element={<Servicos />} />
        <Route path="/servicos/novo" element={<NovoServico />} />
        <Route path="/servicos/editar/:id" element={<EditarServico />} />
        <Route path="/categorias-servico" element={<CategoriasServico />} />

        {/* 📊 RELATÓRIOS */}

        <Route
          path="/relatorios"
          element={<Relatorios />}
        >

          <Route
            index
            element={<DashboardRelatorios />}
          />

          <Route
            path="financeiro"
            element={<FinanceiroRelatorios />}
          />

          <Route
            path="clientes"
            element={<ClientesRelatorios />}
          />

          <Route
            path="servicos"
            element={<ServicosRelatorios />}
          />

        </Route>

        {/* 🚫 ACESSO NEGADO */}
        <Route path="/acesso-negado" element={<AcessoNegado />} />
      </Route>
    </Routes>
  )
}