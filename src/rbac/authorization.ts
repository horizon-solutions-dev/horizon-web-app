import { rolePermissionMatrix } from "./matrix";
import { RBAC_ENFORCED } from "./config";
import type {
  AccessRequirement,
  AppPermission,
  AppRole,
  AuthorizationSnapshot,
} from "./types";

export const normalizeRole = (value?: string | null): AppRole | null => {
  if (!value) return null;

  const normalized = value.trim().toLowerCase();
  const entries = Object.keys(rolePermissionMatrix) as AppRole[];
  return entries.find((role) => role === normalized) ?? null;
};

export const resolvePermissions = (roles: AppRole[]): AppPermission[] => {
  const permissions = new Set<AppPermission>();

  roles.forEach((role) => {
    rolePermissionMatrix[role]?.forEach((permission) =>
      permissions.add(permission),
    );
  });

  return Array.from(permissions);
};

export const buildAuthorizationSnapshot = (
  roles: AppRole[],
): AuthorizationSnapshot => ({
  roles,
  permissions: resolvePermissions(roles),
});

export const hasRole = (
  snapshot: AuthorizationSnapshot,
  role: AppRole,
): boolean => snapshot.roles.includes(role);

export const hasPermission = (
  snapshot: AuthorizationSnapshot,
  permission: AppPermission,
): boolean => snapshot.permissions.includes(permission);

export const checkAccess = (
  snapshot: AuthorizationSnapshot,
  requirement?: AccessRequirement,
): boolean => {
  if (!RBAC_ENFORCED || !requirement) {
    return true;
  }

  const { roles = [], permissions = [], requireAll = false } = requirement;

  const roleResult =
    roles.length === 0
      ? true
      : requireAll
        ? roles.every((role) => hasRole(snapshot, role))
        : roles.some((role) => hasRole(snapshot, role));

  const permissionResult =
    permissions.length === 0
      ? true
      : requireAll
        ? permissions.every((permission) => hasPermission(snapshot, permission))
        : permissions.some((permission) =>
            hasPermission(snapshot, permission),
          );

  return roleResult && permissionResult;
};
