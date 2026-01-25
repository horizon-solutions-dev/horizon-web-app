import { apiClient } from './apiClient';

export interface OrganizationMeResponse {
  organizationId?: string;
  id?: string;
  organization?: {
    organizationId?: string;
    id?: string;
  };
}

class OrganizationService {
  private baseUrl =
    'https://horizondigitalapi-fcgsehgwa7a5hpaf.australiaeast-01.azurewebsites.net/api/v1/organizations';

  async getMyOrganization() {
    try {
      return await apiClient.get<OrganizationMeResponse[]>(`${this.baseUrl}/me`);
    } catch (error) {
      console.error('Erro ao buscar organizacao:', error);
      throw error;
    }
  }

  async getMyOrganizationId() {
    const data = await this.getMyOrganization();
    const storedOrganizationId = localStorage.getItem('organizationId');
    console.log('Dados da organizacao:', data, storedOrganizationId);
    const organizationId =
      data[0].organizationId
 
    if (!organizationId) {
      throw new Error('OrganizationId nao encontrado.');
    }

    return organizationId;
  }
}

export const organizationService = new OrganizationService();
