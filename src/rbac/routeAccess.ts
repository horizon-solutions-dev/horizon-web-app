import RouteNames from "../routes/routeNames";
import { APP_PERMISSIONS } from "./types";
import type { AccessRequirement } from "./types";

export const routeAccessMap: Record<string, AccessRequirement> = {
  [RouteNames.Dashboard]: {
    permissions: [APP_PERMISSIONS.DashboardView],
  },
  [RouteNames.CadastrosOrganizacoes]: {
    permissions: [APP_PERMISSIONS.OrganizationView],
  },
  [RouteNames.Condominio]: {
    permissions: [APP_PERMISSIONS.CondominiumView],
  },
  [RouteNames.CadastrosBlocos]: {
    permissions: [APP_PERMISSIONS.StructureView],
  },
  [RouteNames.CadastrosUnidades]: {
    permissions: [APP_PERMISSIONS.UnitView],
  },
  [RouteNames.CadastrosResidentes]: {
    permissions: [APP_PERMISSIONS.ResidentView],
  },
  [RouteNames.CadastrosPerfis]: {
    permissions: [APP_PERMISSIONS.ProfileView],
  },
  [RouteNames.FinanceiroBoletos]: {
    permissions: [APP_PERMISSIONS.FinancialView],
  },
  [RouteNames.FinanceiroBalancetes]: {
    permissions: [APP_PERMISSIONS.FinancialView],
  },
  [RouteNames.FinanceiroDespesas]: {
    permissions: [APP_PERMISSIONS.FinancialView],
  },
  [RouteNames.PortariaUsuarios]: {
    permissions: [APP_PERMISSIONS.GatehouseView],
  },
  [RouteNames.PortariaVisitantes]: {
    permissions: [APP_PERMISSIONS.GatehouseView],
  },
  [RouteNames.PortariaLiberacao]: {
    permissions: [APP_PERMISSIONS.GatehouseView],
  },
  [RouteNames.PortariaRelatorios]: {
    permissions: [APP_PERMISSIONS.GatehouseView],
  },
  [RouteNames.Veiculos]: {
    permissions: [APP_PERMISSIONS.VehicleView],
  },
  [RouteNames.EncomendasRecebimento]: {
    permissions: [APP_PERMISSIONS.DeliveryView],
  },
  [RouteNames.EncomendasNotificacao]: {
    permissions: [APP_PERMISSIONS.DeliveryView],
  },
  [RouteNames.ReservasTipo]: {
    permissions: [APP_PERMISSIONS.ReservationView],
  },
  [RouteNames.Areas]: {
    permissions: [APP_PERMISSIONS.ReservationView],
  },
  [RouteNames.ReservasListagem]: {
    permissions: [APP_PERMISSIONS.ReservationView],
  },
  [RouteNames.ReservasCalendario]: {
    permissions: [APP_PERMISSIONS.ReservationView],
  },
  [RouteNames.ReservasDisponibilidade]: {
    permissions: [APP_PERMISSIONS.ReservationView],
  },
  [RouteNames.ValidacaoAcesso]: {
    permissions: [APP_PERMISSIONS.PendingView],
  },
};
