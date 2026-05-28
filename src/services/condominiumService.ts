import axios from 'axios';
import { apiClient } from './apiClient';
import type { PagedResponse } from '../models/pagination.model';
import { normalizePagedResponse, type LegacyPagedResponse } from '../shared/utils/pagination';

export interface CondominiumRequest {
  organizationId: string;
  name: string;
  doc: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
  address: string;
  addressNumber: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  condominiumType: number | string;
  physicalStructureId?: number | string;
  unitCount: number;
  hasBlocks: boolean;
  hasWaterIndividual: boolean;
  hasPowerByBlock: boolean;
  hasGasByBlock: boolean;
  commit: boolean;
}

export type CondominiumWithOrganizationRequest = Omit<
  CondominiumRequest,
  "organizationId"
> & {
  orgType: number | string;
};

export interface Condominium extends CondominiumRequest {
  condominiumId: string;
  active: boolean;
  imageType?: string | number;
  contentType?: string;
  thumbnailFile?: string;
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

export interface PhysicalStructureEnum {
  id: number;
  value: string;
  description: string;
}

export type CondominiumPagedResponse = PagedResponse<Condominium>;

class CondominiumService {
  private baseUrl = 'https://horizondigitalapi-fcgsehgwa7a5hpaf.australiaeast-01.azurewebsites.net/api/v1/condominiums';

  async createCondominium(condominium: CondominiumRequest): Promise<string>{
    const data = await apiClient.post<string >(this.baseUrl, condominium);
    console.log('Condominium created with ID:', data);
    return data;
  }

  async validateCondominium(condominium: CondominiumRequest) {
    try {
      await apiClient.post<{ condominiumId?: string }>(this.baseUrl, condominium);
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

  async createCondominiumWithOrganization(
    condominium: CondominiumWithOrganizationRequest,
  ): Promise<string> {
    const data = await apiClient.post<string | { condominiumId: string }>(
      `${this.baseUrl}/with-organization`,
      condominium,
    );
    return typeof data === "string" ? data : data.condominiumId;
  }

  async validateCondominiumWithOrganization(
    condominium: CondominiumWithOrganizationRequest,
  ) {
    try {
      await apiClient.post<{ condominiumId?: string }>(
        `${this.baseUrl}/with-organization`,
        condominium,
      );
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
  async validateCondominiumEdit(condominium: CondominiumRequest, id:string) {
    try {
      await apiClient.put<{ condominiumId?: string }>(`${this.baseUrl}/${id}`, condominium);
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

      const response = await apiClient.get<
        Condominium[] | CondominiumPagedResponse | LegacyPagedResponse<Condominium>
      >(
        `${this.baseUrl}?${params}`
      );
      return normalizePagedResponse(response, pageNumber, pageSize);
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

  async updateCondominium(id: string, condominium: CondominiumRequest): Promise<string> {
    try {
      return await apiClient.put<string>(`${this.baseUrl}/${id}`, condominium);
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

  async getPhysicalStructures() {
    try {
      return await apiClient.get<PhysicalStructureEnum[]>(`${this.baseUrl}/physical-structures`);
    } catch (error) {
      console.error('Erro ao buscar tipos de estrutura fisica:', error);
      throw error;
    }
  }
}

export const condominiumService = new CondominiumService();
