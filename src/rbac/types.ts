export const APP_ROLES = {
  PlatformAdmin: "platform_admin",
  OrganizationAdmin: "organization_admin",
  Syndic: "syndic",
  SubSyndic: "subsyndic",
  Counselor: "counselor",
  Gatehouse: "gatehouse",
  Resident: "resident",
  Collaborator: "collaborator",
  Financial: "financial",
  Auditor: "auditor",
} as const;

export type AppRole = (typeof APP_ROLES)[keyof typeof APP_ROLES];

export const APP_PERMISSIONS = {
  DashboardView: "dashboard.view",
  OrganizationView: "organization.view",
  OrganizationManage: "organization.manage",
  CondominiumView: "condominium.view",
  CondominiumManage: "condominium.manage",
  StructureView: "structure.view",
  StructureManage: "structure.manage",
  UnitView: "unit.view",
  UnitManage: "unit.manage",
  ResidentView: "resident.view",
  ResidentManage: "resident.manage",
  ProfileView: "profile.view",
  ProfileManage: "profile.manage",
  FinancialView: "financial.view",
  FinancialManage: "financial.manage",
  GatehouseView: "gatehouse.view",
  GatehouseManage: "gatehouse.manage",
  VehicleView: "vehicle.view",
  VehicleManage: "vehicle.manage",
  DeliveryView: "delivery.view",
  DeliveryManage: "delivery.manage",
  ReservationView: "reservation.view",
  ReservationManage: "reservation.manage",
  PendingView: "pending.view",
  AuditView: "audit.view",
  ComplianceView: "compliance.view",
  EnvironmentSwitch: "environment.switch",
} as const;

export type AppPermission =
  (typeof APP_PERMISSIONS)[keyof typeof APP_PERMISSIONS];

export type AccessRequirement = {
  roles?: AppRole[];
  permissions?: AppPermission[];
  requireAll?: boolean;
};

export type AuthorizationSnapshot = {
  roles: AppRole[];
  permissions: AppPermission[];
};
