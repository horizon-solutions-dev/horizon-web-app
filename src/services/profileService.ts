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
}

export const profileService = new ProfileService();
