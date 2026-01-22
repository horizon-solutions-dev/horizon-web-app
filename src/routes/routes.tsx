import {
	createBrowserRouter,
} from "react-router-dom";
import LoginFlow from "../components/Login";
import MainLayout from "../components/Layout/MainLayout";
import Dashboard from "../components/Dashboard/Dashboard";

// Reservas
import ReservasTipo from "../components/Reservas/ReservasTipo";
import ReservasListagem from "../components/Reservas/ReservasListagem";
import ReservasCalendario from "../components/Reservas/ReservasCalendario";
import ReservasDisponibilidade from "../components/Reservas/ReservasDisponibilidade";

// Financeiro
import BoletosView from "../components/Financeiro/Boletos/BoletosView";
import BoletosDownload from "../components/Financeiro/Boletos/BoletosDownload";
import BoletosAnexos from "../components/Financeiro/Boletos/BoletosAnexos";
import BalancetesView from "../components/Financeiro/Balancetes/BalancetesView";
import BalancetesDownload from "../components/Financeiro/Balancetes/BalancetesDownload";
import BalancetesRelatorio from "../components/Financeiro/Balancetes/BalancetesRelatorio";
import DespesasCategoria from "../components/Financeiro/Despesas/DespesasCategoria";
import DespesasAnexo from "../components/Financeiro/Despesas/DespesasAnexo";

// Portaria
import PortariaUsuarios from "../components/Portaria/PortariaUsuarios";
import PortariaLiberacao from "../components/Portaria/PortariaLiberacao";
import PortariaRelatorios from "../components/Portaria/PortariaRelatorios";

// Moradores
import Moradores from "../components/Moradores/Moradores";

// Veículos
import Veiculos from "../components/Veiculos/Veiculos";

// Fale Conosco
import FaleConosco from "../components/FaleConosco/FaleConosco";

// Encomendas
import EncomendasRecebimento from "../components/Encomendas/EncomendasRecebimento";
import EncomendasNotificacao from "../components/Encomendas/EncomendasNotificacao";

import RouteNames from "./routeNames";


const router = createBrowserRouter([
	// Public routes
	{
		path: "/",
		element: <LoginFlow />,
	},
	{
		path: RouteNames.Login,
		element: <LoginFlow />,
	},
	
	// Protected routes with MainLayout
	{
		path: "/",
		element: <MainLayout />,
		children: [
			{
				path: RouteNames.Dashboard,
				element: <Dashboard />,
			},
			
			// Reservas
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
				element: <BoletosView />,
			},
			{
				path: RouteNames.FinanceiroBoletosDownload,
				element: <BoletosDownload />,
			},
			{
				path: RouteNames.FinanceiroBoletosAnexos,
				element: <BoletosAnexos />,
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
				path: RouteNames.PortariaLiberacao,
				element: <PortariaLiberacao />,
			},
			{
				path: RouteNames.PortariaRelatorios,
				element: <PortariaRelatorios />,
			},
			
			// Moradores
			{
				path: RouteNames.Moradores,
				element: <Moradores />,
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
		]
	}
])
	
export default router;
