import { apiClient } from './apiClient';

export type ImageType = 
  | 'AccessControl' 
  | 'Banner' 
  | 'ConventionDocument' 
  | 'Cover' 
  | 'Coworking' 
  | 'Damage' 
  | 'Elevator' 
  | 'EmergencyPlan' 
  | 'Entrance' 
  | 'Event' 
  | 'EvacuationRoute' 
  | 'Facade' 
  | 'Garden' 
  | 'Gate' 
  | 'GourmetArea' 
  | 'Gym' 
  | 'Hall' 
  | 'Incident' 
  | 'Inspection' 
  | 'Intercom' 
  | 'Laundry' 
  | 'Logo' 
  | 'Maintenance' 
  | 'Map' 
  | 'Meeting' 
  | 'MonitoringRoom' 
  | 'NoticeBoard' 
  | 'Parking' 
  | 'PartyRoom' 
  | 'PetArea' 
  | 'Playground' 
  | 'Pool' 
  | 'Reception' 
  | 'Sauna' 
  | 'SecurityCamera' 
  | 'SportsCourt' 
  | 'Thumbnail';

export interface CondominiumImage {
  condominiumImageId: string;
  imageType: ImageType;
  contentType: string;
  contentFile: string;
  condominiumId: string;
}

export interface CondominiumImageUpload {
  imageType: ImageType;
  contentFile: File;
  condominiumId: string;
}

export interface ImageTypeEnum {
  id: number;
  value: string;
  description: string;
}

class CondominiumImageService {
  private baseUrl = 'https://horizondigitalapi-fcgsehgwa7a5hpaf.australiaeast-01.azurewebsites.net/api/v1/condominium-images';

  async uploadCondominiumImage(data: CondominiumImageUpload) {
    try {
      const formData = new FormData();
      formData.append('ImageType', data.imageType);
      formData.append('ContentFile', data.contentFile);
      formData.append('CondominiumId', data.condominiumId);

      return await apiClient.post<{ condominiumImageId: string }>(this.baseUrl, formData);
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      throw error;
    }
  }

  async getCondominiumImages(condominiumId: string, imageType?: ImageType) {
    try {
      const params = new URLSearchParams({
        CondominiumId: condominiumId,
        ...(imageType && { ImageType: imageType }),
      });

      return await apiClient.get<CondominiumImage[]>(`${this.baseUrl}?${params}`);
    } catch (error) {
      console.error('Erro ao buscar imagens do condomínio:', error);
      throw error;
    }
  }

  async getCondominiumImageById(id: string) {
    try {
      return await apiClient.get<CondominiumImage>(`${this.baseUrl}/${id}`);
    } catch (error) {
      console.error('Erro ao buscar imagem:', error);
      throw error;
    }
  }

  async downloadCondominiumImage(id: string) {
    try {
      return await apiClient.get<{ contentType: string; contentFile: string; fileName: string }>(
        `${this.baseUrl}/${id}/download`
      );
    } catch (error) {
      console.error('Erro ao baixar imagem:', error);
      throw error;
    }
  }

  async getImageTypes() {
    try {
      return await apiClient.get<ImageTypeEnum[]>(`${this.baseUrl}/types`);
    } catch (error) {
      console.error('Erro ao buscar tipos de imagem:', error);
      throw error;
    }
  }
}

export const condominiumImageService = new CondominiumImageService();
