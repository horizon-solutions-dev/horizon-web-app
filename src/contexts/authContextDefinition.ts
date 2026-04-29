import { createContext } from 'react';
import type { UserAuthorization, UserInfo } from '../models/user.model';
import type { AccessRequirement, AppPermission, AppRole } from '../rbac/types';

export interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserInfo | null;
  authorization: UserAuthorization;
  logout: () => void;
  hasRole: (role: AppRole) => boolean;
  hasPermission: (permission: AppPermission) => boolean;
  canAccess: (requirement?: AccessRequirement) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
