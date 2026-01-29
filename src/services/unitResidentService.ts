import { apiClient } from './apiClient';
import type { UnitType } from './unitService';

export interface CondominiumUnitResidentRequest {
  condominiumUnitId: string;
  userId: string;
  unitType?: UnitType;
  startDate?: string;
  endDate?: string;
  billingContact?: boolean;
  canVote?: boolean;
  canMakeReservations?: boolean;
  hasGatehouseAccess?: boolean;
}

export interface CondominiumUnitResident extends CondominiumUnitResidentRequest {
  condominiumUnitResidentId: string;
}

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
      console.error('Erro ao criar residente:', error);
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

      return await apiClient.get<CondominiumUnitResident[]>(
        `${this.baseUrl}?${params}`
      );
    } catch (error) {
      console.error('Erro ao buscar residentes:', error);
      throw error;
    }
  }

  async getResidentById(id: string) {
    try {
      return await apiClient.get<CondominiumUnitResident>(`${this.baseUrl}/${id}`);
    } catch (error) {
      console.error('Erro ao buscar residente:', error);
      throw error;
    }
  }
}

export const unitResidentService = new UnitResidentService();
