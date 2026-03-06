import { apiClient } from './apiClient';
import type {
  CreateAccountRequest,
  CreateAccountResponse,
  UpdateAccountRequest,
  AccountResponse,
  ChangePasswordRequest,
  TypesDoc,
} from '../models/api.model';
import axios from 'axios';

const BASE_PATH = 'https://horizonauthapi-dfbah3fghze8f9gb.australiaeast-01.azurewebsites.net/api/v1/accounts';

export class AccountService {
  /**
   * Cria uma nova conta de usuário
   */
  static async createAccount(payload: CreateAccountRequest): Promise<string> {
    return apiClient.post<string>(`${BASE_PATH}`, payload);
  }

    static async validateAccount(payload: CreateAccountRequest) {
    try {
      await apiClient.post<{ condominiumUnitResidentId?: string }>(`${BASE_PATH}`, payload);
      return { valid: true, validations: [] as Array<{ field: string; message: string }> };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 422) {
        const data = error.response?.data as
          | { validations?: Array<{ field: string; message: string }> }
          | undefined;
        return { valid: false, validations: data?.validations ?? [] };
      }
      throw error;
    }
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
  static async updateMyAccount(payload: UpdateAccountRequest): Promise<string> {
    return apiClient.put<string>(`${BASE_PATH}/me`, payload);
  }

  /**
   * Atualiza a conta de um usuário específico (requer permissão)
   */
  static async updateAccount(userId: string, payload: UpdateAccountRequest): Promise<string> {
    return apiClient.put<string>(`${BASE_PATH}/${userId}`, payload);
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
  static async accountTypes(): Promise<TypesDoc[]> {
    return apiClient.get<TypesDoc[]>(`${BASE_PATH}/types`);
  }
  static async accountMe(id:string): Promise<AccountResponse> {
    return apiClient.get<AccountResponse>(`${BASE_PATH}/${id}`);
  }
}
