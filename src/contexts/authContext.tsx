import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { AuthService } from '../services/authService';
import { TokenService } from '../services/tokenService';
import { AuthContext } from './authContextDefinition';
import type { UserInfo } from '../models/user.model';

export { AuthContext } from './authContextDefinition';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    // Verificar autenticação ao montar o componente
    const checkAuth = () => {
      const token = AuthService.getToken();
      const isAuth = !!token && !TokenService.isTokenExpired(token);
      
      setIsAuthenticated(isAuth);
      
      if (isAuth && token) {
        // Decodificar o token e extrair os dados do usuário
        const userInfo = TokenService.getUserInfo(token);
        console.log("AuthProvider user:", userInfo);
        setUser(userInfo);
      } else {
        setUser(null);
      }
      
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
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
