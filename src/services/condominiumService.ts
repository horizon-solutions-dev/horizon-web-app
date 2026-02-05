import axios from 'axios';
import { apiClient } from './apiClient';

export interface CondominiumRequest {
  organizationId: string;
  name: string;
  doc: string;
  address: string;
  addressNumber: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  condominiumType: number | string;
  unitCount: number;
  hasBlocks: boolean;
  hasWaterIndividual: boolean;
  hasPowerByBlock: boolean;
  hasGasByBlock: boolean;
  allocationType: 'FractionalAllocation' | 'FixedAllocation' | 'ProportionalAllocation' | string | number;
  allocationValuePerc: number;
  commit: boolean;
}

export interface Condominium extends CondominiumRequest {
  condominiumId: string;
  active: boolean;
}

export interface CondominiumTypeEnum {
  id: number;
  value: string;
  description: string;
}

export interface AllocationTypeEnum {
  id: number;
  value: string;
  description: string;
}

export interface CondominiumPagedResponse {
  data: Condominium[];
  total: number;
  pageNumber: number;
  pageSize: number;
  totalPages?: number;
}

class CondominiumService {
  private baseUrl = 'https://horizondigitalapi-fcgsehgwa7a5hpaf.australiaeast-01.azurewebsites.net/api/v1/condominiums';

  async createCondominium(condominium: CondominiumRequest) {
    const data = await apiClient.post<{ condominiumId: string }>(this.baseUrl, condominium);
    console.log('Condominium created with ID:', data);
    return data;
  }

  async validateCondominium(condominium: CondominiumRequest) {
    const token = localStorage.getItem('token');
    try {
      await axios.post(this.baseUrl, condominium, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
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

  async getCondominiums(organizationId: string, pageNumber?: number, pageSize?: number) {
    try {
      const params = new URLSearchParams({
        Id: organizationId,
        ...(pageNumber !== undefined && { PageNumber: pageNumber.toString() }),
        ...(pageSize !== undefined && { PageSize: pageSize.toString() }),
      });

      const response = await apiClient.get<Condominium[] | CondominiumPagedResponse>(
        `${this.baseUrl}?${params}`
      );

      if (Array.isArray(response)) {
        return {
          data: response,
          total: response.length,
          pageNumber: pageNumber ?? 1,
          pageSize: pageSize || response.length || 1,
          totalPages: 1,
        } satisfies CondominiumPagedResponse;
      }

      return response;
    } catch (error) {
      console.error('Erro ao buscar Condominios:', error);
      throw error;
    }
  }

  async getCondominiumById(id: string) {
    try {
      return await apiClient.get<Condominium>(`${this.baseUrl}/${id}`);
    } catch (error) {
      console.error('Erro ao buscar Condominio:', error);
      throw error;
    }
  }

  async updateCondominium(id: string, condominium: CondominiumRequest) {
    try {
      return await apiClient.put<{ condominiumId: string }>(`${this.baseUrl}/${id}`, condominium);
    } catch (error) {
      console.error('Erro ao atualizar Condominio:', error);
      throw error;
    }
  }

  async getCondominiumTypes() {
    try {
      return await apiClient.get<CondominiumTypeEnum[]>(`${this.baseUrl}/types`);
    } catch (error) {
      console.error('Erro ao buscar tipos de Condominio:', error);
      throw error;
    }
  }

  async getAllocationTypes() {
    try {
      return await apiClient.get<AllocationTypeEnum[]>(`${this.baseUrl}/types/allocations`);
    } catch (error) {
      console.error('Erro ao buscar tipos de alocacao:', error);
      throw error;
    }
  }
}

export const condominiumService = new CondominiumService();
