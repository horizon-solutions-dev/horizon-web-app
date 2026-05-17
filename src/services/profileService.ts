import { apiClient } from './apiClient';

export interface Profile {
  profileId: number;
  code: string;
  name: string;
}

class ProfileService {
  private baseUrl =
    'https://horizondigitalapi-fcgsehgwa7a5hpaf.australiaeast-01.azurewebsites.net/api/v1/profiles';

  async getProfiles() {
    try {
      return await apiClient.get<Profile[]>(this.baseUrl);
    } catch (error) {
      console.error('Erro ao buscar perfis:', error);
      throw error;
    }
  }

  async deleteProfile(profileId: number | string) {
    try {
      return await apiClient.delete<void>(`${this.baseUrl}/${profileId}`);
    } catch (error) {
      console.error('Erro ao excluir perfil:', error);
      throw error;
    }
  }
}

export const profileService = new ProfileService();
