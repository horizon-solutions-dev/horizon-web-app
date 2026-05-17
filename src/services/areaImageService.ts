import { apiClient } from "./apiClient";
import type {
  AreaEnum,
  AreaImageDownloadResponse,
  AreaImageResponse,
  AreaImageType,
} from "../models/area.model";

class AreaImageService {
  private baseUrl =
    "https://horizondigitalapi-fcgsehgwa7a5hpaf.australiaeast-01.azurewebsites.net/api/v1/area-images";

  async uploadAreaImage(areaId: string, contentFile: File, imageType: AreaImageType = "Main") {
    const formData = new FormData();
    formData.append("ImageType", imageType);
    formData.append("ContentFile", contentFile);
    formData.append("AreaId", areaId);

    return await apiClient.post<{ areaImageId: string }>(this.baseUrl, formData);
  }

  async getAreaImages(areaId: string, imageType?: AreaImageType) {
    const params = new URLSearchParams({
      AreaId: areaId,
      ...(imageType && { ImageType: imageType }),
    });
    return await apiClient.get<AreaImageResponse[]>(`${this.baseUrl}?${params}`);
  }

  async getAreaImageById(id: string) {
    return await apiClient.get<AreaImageResponse>(`${this.baseUrl}/${id}`);
  }

  async getAreaImageTypes() {
    return await apiClient.get<AreaEnum[]>(`${this.baseUrl}/types`);
  }

  async downloadAreaImage(id: string) {
    return await apiClient.get<AreaImageDownloadResponse>(
      `${this.baseUrl}/${id}/download`,
    );
  }
}

export const areaImageService = new AreaImageService();
