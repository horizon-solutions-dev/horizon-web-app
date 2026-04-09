import axios from 'axios';
import { apiClient } from './apiClient';
import type { PagedResponse } from '../models/pagination.model';
import { normalizePagedResponse } from '../shared/utils/pagination';
import type { AllocationTypeEnum } from './condominiumService';

export type UnitType = 'Owner' | 'Tenant' | string | '1' | '2' | number;

export interface CondominiumUnitRequest {
  condominiumId: string;
  condominiumBlockId: string;
  unitCode: string;
  unitType: 'Owner' | 'Tenant' | string | '1' | '2' | number; // 'Owner' | 'Tenant' | string;
  allocationType?: 'FractionalAllocation' | 'FixedAllocation' | 'ProportionalAllocation' | string | number; // 'FractionalAllocation' | 'FixedAllocation' | 'ProportionalAllocation' | string;
  allocationTypeValue?: string | number;
  commit?: boolean;
}
export interface CondominiumUnitResponse {
  condominiumId: string;
  condominiumBlockId: string;
  unitCode: string;
  unitType?: 1 | 2 | '1' | '2' | string;
  allocationType?: 1 | 2 | 3 | '1' | '2' | '3' | string;
  allocationTypeValue?: string | number;
}

export interface CondominiumUnit extends CondominiumUnitResponse {
  condominiumUnitId: string;
}

export type CondominiumUnitPagedResponse = PagedResponse<CondominiumUnit>;

export interface UnitTypeEnum {
  id: number;
  value: string;
  description: string;
}

class UnitService {
  private baseUrl =
    'https://horizondigitalapi-fcgsehgwa7a5hpaf.australiaeast-01.azurewebsites.net/api/v1/units';

  async createUnit(unit: CondominiumUnitRequest) {
    try {
      return await apiClient.post<{ condominiumUnitId: string }>(this.baseUrl, unit);
    } catch (error) {
      console.error('Erro ao criar unidade:', error);
      throw error;
    }
  }

  async validateUnitEdit(unit: CondominiumUnitRequest, id:string) {
    try {
      await apiClient.put<{ condominiumUnitId?: string }>(this.baseUrl + '/' + id, unit);
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
  async validateUnit(unit: CondominiumUnitRequest) {
    try {
      await apiClient.post<{ condominiumUnitId?: string }>(this.baseUrl, unit);
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

  async getUnitById(id: string) {
    try {
      return await apiClient.get<CondominiumUnit>(`${this.baseUrl}/${id}`);
    } catch (error) {
      console.error('Erro ao buscar unidade:', error);
      throw error;
    }
  }

  async updateUnit(id: string, unit: CondominiumUnitRequest) {
    try {
      return await apiClient.put<{ condominiumUnitId: string }>(`${this.baseUrl}/${id}`, unit);
    } catch (error) {
      console.error('Erro ao atualizar unidade:', error);
      throw error;
    }
  }

  async getUnitsByBlock(blockId: string, pageNumber?: number, pageSize?: number) {
    try {
      const params = new URLSearchParams({
        Id: blockId,
        ...(pageNumber !== undefined && { PageNumber: pageNumber.toString() }),
        ...(pageSize !== undefined && { PageSize: pageSize.toString() }),
      });

      const response = await apiClient.get<CondominiumUnit[] | CondominiumUnitPagedResponse>(
        `${this.baseUrl}/by-block?${params}`
      );

      return normalizePagedResponse(response, pageNumber, pageSize);
    } catch (error) {
      console.error('Erro ao buscar unidades por bloco:', error);
      throw error;
    }
  }

  async getUnitsByCondominium(condominiumId: string, pageNumber?: number, pageSize?: number) {
    try {
      const params = new URLSearchParams({
        Id: condominiumId,
        ...(pageNumber !== undefined && { PageNumber: pageNumber.toString() }),
        ...(pageSize !== undefined && { PageSize: pageSize.toString() }),
      });

      const response = await apiClient.get<CondominiumUnit[] | CondominiumUnitPagedResponse>(
        `${this.baseUrl}/by-condominium?${params}`
      );

      return normalizePagedResponse(response, pageNumber, pageSize);
    } catch (error) {
      console.error('Erro ao buscar unidades por condominio:', error);
      throw error;
    }
  }

  async getUnitTypes() {
    try {
      return await apiClient.get<UnitTypeEnum[]>(`${this.baseUrl}/types`);
    } catch (error) {
      console.error('Erro ao buscar tipos de unidade:', error);
      throw error;
    }
  }

  async getAllocationTypes() {
    try {
      return await apiClient.get<AllocationTypeEnum[]>(`${this.baseUrl}/allocation-types`);
    } catch (error) {
      console.error('Erro ao buscar tipos de rateio da unidade:', error);
      throw error;
    }
  }
}

export const unitService = new UnitService();
