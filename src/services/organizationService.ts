import axios from 'axios';
import { apiClient } from './apiClient';

export interface OrganizationMeResponse {
  active: boolean;
  city: string;
  doc: string;              // CNPJ
  email: string;
  legalName: string;
  name: string;
  orgType: number;          // ex: 1 = empresa, 2 = condomínio (ajuste conforme regra)
  organizationId: string;   // UUID
  phone: string;
  state: string;            // UF
  zipCode?: string;
  cep?: string;
}

export interface OrganizationRequest {
  name: string;
  legalName: string;
  doc: string;
  orgType?: number | string;
  email: string;
  phone: string;
  city: string;
  state: string;
  zipCode?: string;
  cep?: string;
  commit?: boolean;
}

export interface Organization extends OrganizationRequest {
  organizationId: string;
  active?: boolean;
}

export interface OrganizationTypeEnum {
  id: number;
  value: string;
  description: string;
}

export interface OrganizationUserRequest {
  userId: string;
  profileId: number;
  owner: boolean;
}

type OrganizationCreateResponse = { organizationId: string } | string;
type OrganizationUserCreateResponse = { organizationUserId: string } | string;

class OrganizationService {
  private baseUrl =
    'https://horizondigitalapi-fcgsehgwa7a5hpaf.australiaeast-01.azurewebsites.net/api/v1/organizations';

  async createOrganization(payload: OrganizationRequest) {
    try {
      return await apiClient.post<OrganizationCreateResponse>(this.baseUrl, payload);
    } catch (error) {
      console.error('Erro ao criar organizacao:', error);
      throw error;
    }
  }

  async validateOrganization(payload: OrganizationRequest) {
    const token = localStorage.getItem('token');
    try {
      await axios.post(this.baseUrl, payload, {
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

  async getOrganizationById(id: string) {
    try {
      return await apiClient.get<Organization>(`${this.baseUrl}/${id}`);
    } catch (error) {
      console.error('Erro ao buscar organizacao:', error);
      throw error;
    }
  }

  async updateOrganization(id: string, payload: OrganizationRequest) {
    try {
      return await apiClient.put<{ organizationId: string }>(`${this.baseUrl}/${id}`, payload);
    } catch (error) {
      console.error('Erro ao atualizar organizacao:', error);
      throw error;
    }
  }

  async addUserToOrganization(organizationId: string, payload: OrganizationUserRequest) {
    try {
      return await apiClient.post<OrganizationUserCreateResponse>(
        `${this.baseUrl}/${organizationId}/users`,
        payload
      );
    } catch (error) {
      console.error('Erro ao associar usuario a organizacao:', error);
      throw error;
    }
  }

  async getMyOrganization() {
    try {
      return await apiClient.get<OrganizationMeResponse[]>(`${this.baseUrl}/me`);
    } catch (error) {
      console.error('Erro ao buscar organizacao:', error);
      throw error;
    }
  }

  async getOrganizationTypes() {
    try {
      return await apiClient.get<OrganizationTypeEnum[]>(`${this.baseUrl}/types`);
    } catch (error) {
      console.error('Erro ao buscar tipos de organizacao:', error);
      throw error;
    }
  }

  async getMyOrganizationId() {
    const storedOrganizationId = localStorage.getItem('organizationId');
    const organizationId = storedOrganizationId;

    return organizationId;
  }
}

export const organizationService = new OrganizationService();

