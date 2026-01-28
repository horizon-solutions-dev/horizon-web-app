import {
	createBrowserRouter,
} from "react-router-dom";
import LoginFlow from "../components/Login";
import MainLayout from "../components/Layout/MainLayout";
import Dashboard from "../components/Dashboard/Dashboard";
import { ProtectedRoute } from "./ProtectedRoute";
import { PublicRoute } from "./PublicRoute";

// Reservas
import ReservasTipo from "../components/Reservas/ReservasTipo";
import ReservasListagem from "../components/Reservas/ReservasListagem";
import ReservasCalendario from "../components/Reservas/ReservasCalendario";
import ReservasDisponibilidade from "../components/Reservas/ReservasDisponibilidade";

// Financeiro
import Boletos from "../components/Boletos";
import BalancetesView from "../components/Financeiro/Balancetes/BalancetesView";
import BalancetesDownload from "../components/Financeiro/Balancetes/BalancetesDownload";
import BalancetesRelatorio from "../components/Financeiro/Balancetes/BalancetesRelatorio";
import DespesasCategoria from "../components/Financeiro/Despesas/DespesasCategoria";
import DespesasAnexo from "../components/Financeiro/Despesas/DespesasAnexo";

// Portaria
import PortariaUsuarios from "../components/Portaria/PortariaUsuarios";
import PortariaLiberacao from "../components/Portaria/PortariaLiberacao";
import PortariaRelatorios from "../components/Portaria/PortariaRelatorios";



// Condominio
import CondominioForm from "../components/Condominio/Condominio";

// Fale Conosco
import FaleConosco from "../components/FaleConosco/FaleConosco";

// Encomendas
import EncomendasRecebimento from "../components/Encomendas/EncomendasRecebimento";
import EncomendasNotificacao from "../components/Encomendas/EncomendasNotificacao";

import RouteNames from "./routeNames";
import Moradores from "../components/Moradores/Moradores";
import Veiculos from "../components/Veiculos/Veiculos";


const router = createBrowserRouter([
	// Public routes - Login
	{
		path: "/",
		element: <PublicRoute><LoginFlow /></PublicRoute>,
	},
	{
		path: RouteNames.Login,
		element: <PublicRoute><LoginFlow /></PublicRoute>,
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
