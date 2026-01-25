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

class CondominiumService {
  private baseUrl = 'https://horizondigitalapi-fcgsehgwa7a5hpaf.australiaeast-01.azurewebsites.net/api/v1/condominiums';

  async createCondominium(condominium: CondominiumRequest) {
    try {
      return await apiClient.post<{ condominiumId: string }>(this.baseUrl, condominium);
    } catch (error) {
      console.error('Erro ao criar condomínio:', error);
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

      return await apiClient.get<Condominium[]>(`${this.baseUrl}?${params}`);
    } catch (error) {
      console.error('Erro ao buscar condomínios:', error);
      throw error;
    }
  }

  async getCondominiumById(id: string) {
    try {
      return await apiClient.get<Condominium>(`${this.baseUrl}/${id}`);
    } catch (error) {
      console.error('Erro ao buscar condomínio:', error);
      throw error;
    }
  }

  async updateCondominium(id: string, condominium: CondominiumRequest) {
    try {
      return await apiClient.put<{ condominiumId: string }>(`${this.baseUrl}/${id}`, condominium);
    } catch (error) {
      console.error('Erro ao atualizar condomínio:', error);
      throw error;
    }
  }

  async getCondominiumTypes() {
    try {
      return await apiClient.get<CondominiumTypeEnum[]>(`${this.baseUrl}/types`);
    } catch (error) {
      console.error('Erro ao buscar tipos de condomínio:', error);
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
