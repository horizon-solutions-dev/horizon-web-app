import { createContext } from 'react';
import type { UserInfo } from '../models/user.model';

export interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserInfo | null;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
