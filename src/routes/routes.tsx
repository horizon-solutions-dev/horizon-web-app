import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../components/Layout/MainLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { PublicRoute } from "./PublicRoute";

import RouteNames from "./routeNames";

const LoginFlow = lazy(() => import("../components/Login"));
const PrimeiroAcessoWizard = lazy(
	() => import("../components/PrimeiroAcesso/PrimeiroAcessoWizard"),
);
const Dashboard = lazy(() => import("../components/Dashboard/Dashboard"));
const ReservasTipo = lazy(() => import("../components/Reservas/ReservasTipo"));
const ReservasListagem = lazy(
	() => import("../components/Reservas/ReservasListagem"),
);
const ReservasCalendario = lazy(
	() => import("../components/Reservas/ReservasCalendario"),
);
const ReservasDisponibilidade = lazy(
	() => import("../components/Reservas/ReservasDisponibilidade"),
);
const Boletos = lazy(() => import("../components/Boletos"));
const BalancetesView = lazy(
	() => import("../components/Financeiro/Balancetes/BalancetesView"),
);
const BalancetesDownload = lazy(
	() => import("../components/Financeiro/Balancetes/BalancetesDownload"),
);
const BalancetesRelatorio = lazy(
	() => import("../components/Financeiro/Balancetes/BalancetesRelatorio"),
);
const DespesasCategoria = lazy(
	() => import("../components/Financeiro/Despesas/DespesasCategoria"),
);
const DespesasAnexo = lazy(
	() => import("../components/Financeiro/Despesas/DespesasAnexo"),
);
const PortariaUsuarios = lazy(
	() => import("../components/Portaria/PortariaUsuarios"),
);
const Visitantes = lazy(() => import("../components/Portaria/Visitantes"));
const PortariaLiberacao = lazy(
	() => import("../components/Portaria/PortariaLiberacao"),
);
const PortariaRelatorios = lazy(
	() => import("../components/Portaria/PortariaRelatorios"),
);
const CondominioForm = lazy(
	() => import("../components/Condominio/Condominio"),
);
const FaleConosco = lazy(
	() => import("../components/FaleConosco/FaleConosco"),
);
const EncomendasRecebimento = lazy(
	() => import("../components/Encomendas/EncomendasRecebimento"),
);
const EncomendasNotificacao = lazy(
	() => import("../components/Encomendas/EncomendasNotificacao"),
);
const Veiculos = lazy(() => import("../components/Veiculos/Veiculos"));
const EstruturaCondominio = lazy(() => import("../components/Blocos/Blocos"));
const Unidades = lazy(() => import("../components/Unidades/Unidades"));
const Residentes = lazy(() => import("../components/Residentes/Residentes"));
const Organizacoes = lazy(
	() => import("../components/Organizacoes/Organizacoes"),
);
const Perfis = lazy(() => import("../components/Perfis/Perfis"));
const ValidacaoAcesso = lazy(
	() => import("../components/Pendentes/ValidacaoAcesso"),
);


const router = createBrowserRouter([
	// Public routes - Login
	{
		path: "/",
		element: <PublicRoute><LoginFlow /></PublicRoute>,
	},
				{
				path: RouteNames.PrimeiroAcesso,
				element: <PrimeiroAcessoWizard />,
			},
	
	// Protected routes with MainLayout
	{
		path: "/",
		element: (
			<ProtectedRoute>
				<MainLayout />
			</ProtectedRoute>
		),
		children: [
			{
				path: RouteNames.Dashboard,
				element: <Dashboard />,
			},
			
			// Reservas
			{
				path: RouteNames.Areas,
				element: <ReservasTipo />,
			},
			{
				path: RouteNames.ReservasTipo,
				element: <ReservasTipo />,
			},
			{
				path: RouteNames.ReservasListagem,
				element: <ReservasListagem />,
			},
			{
				path: RouteNames.ReservasCalendario,
				element: <ReservasCalendario />,
			},
			{
				path: RouteNames.ReservasDisponibilidade,
				element: <ReservasDisponibilidade />,
			},
			
			// Financeiro - Boletos
			{
				path: RouteNames.FinanceiroBoletos,
				element: <Boletos />,
			},
			
			// Financeiro - Balancetes
			{
				path: RouteNames.FinanceiroBalancetes,
				element: <BalancetesView />,
			},
			{
				path: RouteNames.FinanceiroBalancetesDownload,
				element: <BalancetesDownload />,
			},
			{
				path: RouteNames.FinanceiroBalancetesRelatorio,
				element: <BalancetesRelatorio />,
			},
			
			// Financeiro - Despesas
			{
				path: RouteNames.FinanceiroDespesas,
				element: <DespesasCategoria />,
			},
			{
				path: RouteNames.FinanceiroDespesasAnexo,
				element: <DespesasAnexo />,
			},
			
			// Portaria
			{
				path: RouteNames.PortariaUsuarios,
				element: <PortariaUsuarios />,
			},
			{
				path: RouteNames.PortariaVisitantes,
				element: <Visitantes />,
			},
			{
				path: RouteNames.PortariaLiberacao,
				element: <PortariaLiberacao />,
			},
			{
				path: RouteNames.PortariaRelatorios,
				element: <PortariaRelatorios />,
			},
			
			// Condominio
			{
				path: RouteNames.Condominio,
				element: <CondominioForm />,
			},
			
			// Cadastros
			{
				path: RouteNames.CadastrosBlocos,
				element: <EstruturaCondominio />,
			},
			{
				path: RouteNames.CadastrosUnidades,
				element: <Unidades />,
			},
			{
				path: RouteNames.CadastrosResidentes,
				element: <Residentes />,
			},
			{
				path: RouteNames.CadastrosOrganizacoes,
				element: <Organizacoes />,
			},
			{
				path: RouteNames.CadastrosPerfis,
				element: <Perfis />,
			},
			
			// Veículos
			{
				path: RouteNames.Veiculos,
				element: <Veiculos />,
			},
			
			// Fale Conosco
			{
				path: RouteNames.FaleConosco,
				element: <FaleConosco />,
			},
			
			// Encomendas
			{
				path: RouteNames.EncomendasRecebimento,
				element: <EncomendasRecebimento />,
			},
			{
				path: RouteNames.EncomendasNotificacao,
				element: <EncomendasNotificacao />,
			},
			{
				path: RouteNames.ValidacaoAcesso,
				element: <ValidacaoAcesso />,
			},
		]
	}
])
	
export default router;
