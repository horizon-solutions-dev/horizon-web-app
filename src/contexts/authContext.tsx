import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AuthService } from "../services/authService";
import { TokenService } from "../services/tokenService";
import { AuthContext } from "./authContextDefinition";
import type { UserAuthorization, UserInfo } from "../models/user.model";
import {
  buildAuthorizationSnapshot,
  checkAccess,
  hasPermission,
  hasRole,
} from "../rbac/authorization";
import type { AccessRequirement, AppPermission, AppRole } from "../rbac/types";

export { AuthContext } from "./authContextDefinition";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [authorization, setAuthorization] = useState<UserAuthorization>(
    buildAuthorizationSnapshot([]),
  );

  useEffect(() => {
    const checkAuth = () => {
      const token = AuthService.getToken();
      const isAuth = !!token && !TokenService.isTokenExpired(token);

      setIsAuthenticated(isAuth);

      if (isAuth && token) {
        const userInfo = TokenService.getUserInfo(token);
        setUser(userInfo);
        setAuthorization(buildAuthorizationSnapshot(userInfo?.roles ?? []));
      } else {
        setUser(null);
        setAuthorization(buildAuthorizationSnapshot([]));
      }

      setIsLoading(false);
    };

    checkAuth();
    window.addEventListener("storage", checkAuth);

    return () => {
      window.removeEventListener("storage", checkAuth);
    };
  }, []);

  const logout = () => {
    AuthService.logout();
    setIsAuthenticated(false);
    setUser(null);
    setAuthorization(buildAuthorizationSnapshot([]));
  };

  const handleHasRole = (role: AppRole) => hasRole(authorization, role);
  const handleHasPermission = (permission: AppPermission) =>
    hasPermission(authorization, permission);
  const handleCanAccess = (requirement?: AccessRequirement) =>
    checkAccess(authorization, requirement);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        authorization,
        logout,
        hasRole: handleHasRole,
        hasPermission: handleHasPermission,
        canAccess: handleCanAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
