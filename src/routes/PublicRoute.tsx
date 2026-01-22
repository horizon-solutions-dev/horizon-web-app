import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import RouteNames from './routeNames';

interface PublicRouteProps {
  children: React.ReactNode;
}

/**
 * Componente para rotas públicas que redirecionam para dashboard se já autenticado
 */
export function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}>
        <div style={{
          textAlign: 'center',
          color: 'white',
        }}>
          <div style={{
            fontSize: '18px',
            fontWeight: '600',
            marginBottom: '20px',
          }}>
            Carregando...
          </div>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto',
          }} />
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // Se já autenticado, redireciona para dashboard
  if (isAuthenticated) {
    return <Navigate to={RouteNames.Dashboard} replace />;
  }

  // Se não autenticado, renderiza o componente
  return <>{children}</>;
}
