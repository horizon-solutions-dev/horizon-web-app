import { jwtDecode } from 'jwt-decode';
import type { AuthTokenPayload } from '../models/user.model';
import {
  buildAuthorizationSnapshot,
  normalizeRole,
} from '../rbac/authorization';
import { APP_ROLES } from '../rbac/types';

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
    if (!decoded) {
      return null;
    }

    const normalizedRoles = this.getRolesFromToken(decoded);
    const authorization = buildAuthorizationSnapshot(normalizedRoles);

    return {
      name: decoded.Fullname || decoded.Name || 'Usuário',
      email: decoded.Doc || '',
      role: normalizedRoles[0] || APP_ROLES.Resident,
      profileCode: decoded.ProfileCode,
      roles: authorization.roles,
      permissions: authorization.permissions,
    };
  }

  static getRolesFromToken(decoded: AuthTokenPayload): Array<(typeof APP_ROLES)[keyof typeof APP_ROLES]> {
    const rawRoles = Array.isArray(decoded.Roles)
      ? decoded.Roles
      : typeof decoded.Roles === 'string'
        ? decoded.Roles.split(',')
        : decoded.Role
          ? [decoded.Role]
          : [];

    const normalizedRoles = rawRoles
      .map((role) => normalizeRole(role))
      .filter((role): role is (typeof APP_ROLES)[keyof typeof APP_ROLES] => Boolean(role));

    if (normalizedRoles.length > 0) {
      return normalizedRoles;
    }

    return [APP_ROLES.Resident];
  }

  /**
   * Retorna o userId do token
   */
  static getUserId(token: string | null): string | null {
    if (!token) {
      return null;
    }

    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.UserId) {
      return null;
    }

    return decoded.UserId;
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
