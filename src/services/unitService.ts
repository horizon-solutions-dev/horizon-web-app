import { apiClient } from './apiClient';

export type UnitType = 'Owner' | 'Tenant' | string;

export interface CondominiumUnitRequest {
  condominiumId: string;
  condominiumBlockId: string;
  unitCode: string;
  unitType?: UnitType;
}
export interface CondominiumUnitResponse {
  condominiumId: string;
  condominiumBlockId: string;
  unitCode: string;
  unitType?: '1' | '2' | string;
}

export interface CondominiumUnit extends CondominiumUnitResponse {
  condominiumUnitId: string;
}

export interface CondominiumUnitPagedResponse {
  data: CondominiumUnit[];
  total: number;
  pageNumber: number;
  pageSize: number;
  totalPages?: number;
}

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

      const response = await apiClient.get<CondominiumUnitPagedResponse>(
        `${this.baseUrl}/by-block?${params}`
      );

      if (Array.isArray(response)) {
        return {
          data: response,
          total: response.length,
          pageNumber: pageNumber ?? 1,
          pageSize: pageSize || response.length || 1,
          totalPages: 1,
        } satisfies CondominiumUnitPagedResponse;
      }

      return {};
    } catch (error) {
      console.error('Erro ao buscar unidades por bloco:', error);
      return{
        data: [] as CondominiumUnit[],
        total: 0,
        pageNumber: 1,
        pageSize: 0,
        totalPages: 0,
      }
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

      if (Array.isArray(response)) {
        return {
          data: response,
          total: response.length,
          pageNumber: pageNumber ?? 1,
          pageSize: pageSize || response.length || 1,
          totalPages: 1,
        } satisfies CondominiumUnitPagedResponse;
      }

      return response;
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
}

export const unitService = new UnitService();
