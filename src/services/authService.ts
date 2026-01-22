import { apiClient } from './apiClient';
import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  PasswordRecoveryRequest,
  PasswordRecoveryResponse,
  VerifyRecoveryCodeRequest,
  VerifyRecoveryCodeResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
} from '../models/api.model';

const BASE_PATH = '/api/v1/auth';

export class AuthService {
  /**
   * Realiza login do usuário
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
   * Solicita código de recuperação de senha por email
   * (Este endpoint pode não existir na API atual, será necessário criar no backend)
   */
  static async requestPasswordRecovery(payload: PasswordRecoveryRequest): Promise<PasswordRecoveryResponse> {
    return apiClient.post<PasswordRecoveryResponse>(`${BASE_PATH}/password-recovery/request`, payload);
  }

  /**
   * Verifica o código de recuperação de senha
   * (Este endpoint pode não existir na API atual, será necessário criar no backend)
   */
  static async verifyRecoveryCode(payload: VerifyRecoveryCodeRequest): Promise<VerifyRecoveryCodeResponse> {
    return apiClient.post<VerifyRecoveryCodeResponse>(`${BASE_PATH}/password-recovery/verify`, payload);
  }

  /**
   * Reseta a senha do usuário com código de recuperação
   * (Este endpoint pode não existir na API atual, será necessário criar no backend)
   */
  static async resetPassword(payload: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    return apiClient.post<ResetPasswordResponse>(`${BASE_PATH}/password-recovery/reset`, payload);
  }

  /**
   * Faz logout do usuário
   */
  static logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userCompany');
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
