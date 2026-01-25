import { apiClient } from './apiClient';
import type {
  CreateAccountRequest,
  CreateAccountResponse,
  UpdateAccountRequest,
  AccountResponse,
  ChangePasswordRequest,
} from '../models/api.model';

const BASE_PATH = 'https://horizonauthapi-dfbah3fghze8f9gb.australiaeast-01.azurewebsites.net/api/v1/accounts';

export class AccountService {
  /**
   * Cria uma nova conta de usuário
   */
  static async createAccount(payload: CreateAccountRequest): Promise<CreateAccountResponse> {
    return apiClient.post<CreateAccountResponse>(`${BASE_PATH}`, payload);
  }

  /**
   * Obtém os dados da conta do usuário logado
   */
  static async getMyAccount(): Promise<AccountResponse> {
    return apiClient.get<AccountResponse>(`${BASE_PATH}/me`);
  }

  /**
   * Atualiza a conta do usuário logado
   */
  static async updateMyAccount(payload: UpdateAccountRequest): Promise<CreateAccountResponse> {
    return apiClient.put<CreateAccountResponse>(`${BASE_PATH}/me`, payload);
  }

  /**
   * Atualiza a conta de um usuário específico (requer permissão)
   */
  static async updateAccount(userId: string, payload: UpdateAccountRequest): Promise<CreateAccountResponse> {
    return apiClient.put<CreateAccountResponse>(`${BASE_PATH}/${userId}`, payload);
  }

  /**
   * Altera a senha do usuário logado
   */
  static async changePassword(payload: ChangePasswordRequest): Promise<CreateAccountResponse> {
    return apiClient.put<CreateAccountResponse>(`${BASE_PATH}/me/password`, payload);
  }

  /**
   * Obtém a lista de contas por condomínio
   */
  static async getAccountsByCondominium(
    condominiumId: string,
    pageNumber: number = 1,
    pageSize: number = 10
  ): Promise<{
    data: AccountResponse[];
    total: number;
    pageNumber: number;
    pageSize: number;
  }> {
    return apiClient.get<{
      data: AccountResponse[];
      total: number;
      pageNumber: number;
      pageSize: number;
    }>(
      `${BASE_PATH}/condominium?Id=${condominiumId}&PageNumber=${pageNumber}&PageSize=${pageSize}`
    );
  }

  /**
   * Cria um status para a conta de um usuário
   */
  static async createAccountStatus(statusId: number): Promise<CreateAccountResponse> {
    return apiClient.post<CreateAccountResponse>(`${BASE_PATH}/status`, { statusId });
  }
}
