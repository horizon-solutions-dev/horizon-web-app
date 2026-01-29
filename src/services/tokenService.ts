import { jwtDecode } from 'jwt-decode';
import type { AuthTokenPayload } from '../models/user.model';

export class TokenService {
  /**
   * Decodifica o token JWT e retorna os dados do usuário
   */
  static decodeToken(token: string): AuthTokenPayload | null {
    try {
      if (!token) {
        return null;
      }
      const decoded = jwtDecode<AuthTokenPayload>(token);
      return decoded;
    } catch (error) {
      console.error('Erro ao decodificar token:', error);
      return null;
    }
  }

  /**
   * Extrai informações do usuário do token
   */
  static getUserInfo(token: string | null) {
    if (!token) {
      return null;
    }

    const decoded = this.decodeToken(token);
    console.log("Decoded token:", decoded);
    if (!decoded) {
      return null;
    }

    // Retornar objeto com estrutura UserInfo baseada nos dados do token
    return {
      name: decoded.Fullname || decoded.Name || 'Usuário',
      email: decoded.Doc || '',
      role: 'Usuário'
    };
  }
  
  /**
   * Verifica se o token está expirado
   */
  static isTokenExpired(token: string | null): boolean {
    if (!token) {
      return true;
    }

    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) {
      return false;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  }

  /**
   * Retorna o tempo até expiração do token em segundos
   */
  static getTimeUntilExpiration(token: string | null): number | null {
    if (!token) {
      return null;
    }

    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) {
      return null;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return Math.max(0, decoded.exp - currentTime);
  }
}
