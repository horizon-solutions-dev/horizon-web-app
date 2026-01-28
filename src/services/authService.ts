import { apiClient } from './apiClient';
import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
} from '../models/api.model';

const BASE_PATH = 'https://horizonauthapi-dfbah3fghze8f9gb.australiaeast-01.azurewebsites.net/api/v1/auth';

export class AuthService {
  /**
   * Realiza login do usuario
   */
  static async login(payload: LoginRequest): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>(`${BASE_PATH}/login`, payload);
  }

  /**
   * Atualiza o token de acesso usando o refresh token
   */
  static async refreshToken(payload: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    return apiClient.post<RefreshTokenResponse>(`${BASE_PATH}/refresh-token`, payload);
  }


  /**
   * Faz logout do usuário
   */
  static logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('condominiumId');
    localStorage.removeItem('condominium');
    localStorage.removeItem('organizationId');
    localStorage.removeItem('isAuthenticated');
  }

  /**
   * Retorna se o usuário está autenticado
   */
  static isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    return !!token;
  }

  /**
   * Retorna o token armazenado
   */
  static getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Retorna o refresh token armazenado
   */
  static getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }
}
