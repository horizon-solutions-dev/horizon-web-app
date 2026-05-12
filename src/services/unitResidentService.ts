import axios from 'axios';
import { apiClient } from './apiClient';
import type { UnitType } from './unitService';
import type { PagedResponse } from '../models/pagination.model';
import { normalizePagedResponse } from '../shared/utils/pagination';
import type { AccountResponse } from '../models/api.model';

type ResidentDocType = AccountResponse['docType'] | number | string;

export interface CondominiumUnitResidentRequest {
  condominiumUnitId: string;
  userId: string;
  fullname: string;
  docType: ResidentDocType;
  doc: string;
  email: string;
  phone: string;
  unitType?: UnitType;
  startDate?: string;
  endDate?: string;
  billingContact?: boolean;
  canVote?: boolean;
  canMakeReservations?: boolean;
  hasGatehouseAccess?: boolean;
  commit?: boolean;
}

export interface CondominiumUnitResident extends CondominiumUnitResidentRequest {
  condominiumUnitResidentId: string;
  contentType?: string;
  thumbnailFile?: string;
  active?: boolean;
}

export type CondominiumUnitResidentPagedResponse = PagedResponse<CondominiumUnitResident>;

class UnitResidentService {
  private baseUrl =
    'https://horizondigitalapi-fcgsehgwa7a5hpaf.australiaeast-01.azurewebsites.net/api/v1/unit-residents';

  async createResident(resident: CondominiumUnitResidentRequest) {
    try {
      return await apiClient.post<{ condominiumUnitResidentId: string }>(
        this.baseUrl,
        resident
      );
    } catch (error) {
      console.error('Erro ao criar morador:', error);
      throw error;
    }
  }

  async updateResident(id: string, resident: CondominiumUnitResidentRequest) {
    try {
      return await apiClient.put<{ condominiumUnitResidentId: string }>(
        `${this.baseUrl}/${id}`,
        resident
      );
    } catch (error) {
      console.error('Erro ao atualizar morador:', error);
      throw error;
    }
  }

  async validateResident(resident: CondominiumUnitResidentRequest) {
    try {
      await apiClient.post<{ condominiumUnitResidentId?: string }>(this.baseUrl, resident);
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

  async getResidents(id: string, pageNumber?: number, pageSize?: number) {
    try {
      const params = new URLSearchParams({
        Id: id,
        ...(pageNumber !== undefined && { PageNumber: pageNumber.toString() }),
        ...(pageSize !== undefined && { PageSize: pageSize.toString() }),
      });

      const response = await apiClient.get<CondominiumUnitResident[] | CondominiumUnitResidentPagedResponse>(
        `${this.baseUrl}?${params}`
      );
      
      return normalizePagedResponse(response, pageNumber, pageSize);
    } catch (error) {
      console.error('Erro ao buscar moradores:', error);
      throw error;
    }
  }

  async getResidentById(id: string) {
    try {
      return await apiClient.get<CondominiumUnitResident>(`${this.baseUrl}/${id}`);
    } catch (error) {
      console.error('Erro ao buscar morador:', error);
      throw error;
    }
  }
}

export const unitResidentService = new UnitResidentService();
