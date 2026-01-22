import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { AuthService } from '../services/authService';
import { AuthContext } from './authContextDefinition';

export { AuthContext } from './authContextDefinition';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar autenticação ao montar o componente
    const checkAuth = () => {
      const token = AuthService.getToken();
      setIsAuthenticated(!!token);
      setIsLoading(false);
    };

    checkAuth();

    // Listener para mudanças de autenticação
    window.addEventListener('storage', checkAuth);
    
    return () => {
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  const logout = () => {
    AuthService.logout();
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
