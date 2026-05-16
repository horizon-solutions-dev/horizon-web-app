import { apiClient } from "./apiClient";

export type UnitImageType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type UnitImageTypeQuery = UnitImageType | string;

export interface CondominiumUnitImage {
  condominiumUnitImageId: string;
  imageType: UnitImageType;
  contentType: string;
  contentFile?: string;
  condominiumId: string;
  condominiumUnitId: string;
  userId: string;
  licensePlate?: string;
  vehicleManufacturer?: string;
  vehicleModel?: string;
}

export interface CondominiumUnitImageUpload {
  imageType: UnitImageType;
  contentFile: File;
  condominiumId: string;
  condominiumUnitId: string;
  userId: string;
  licensePlate?: string;
  vehicleManufacturer?: string;
  vehicleModel?: string;
}

export interface UnitImageTypeEnum {
  id: number;
  value: string;
  description: string;
}

class CondominiumUnitImageService {
  private baseUrl =
    "https://horizondigitalapi-fcgsehgwa7a5hpaf.australiaeast-01.azurewebsites.net/api/v1/condominium-unit-images";

  async uploadUnitImage(data: CondominiumUnitImageUpload) {
    const formData = new FormData();

    formData.append("ImageType", String(data.imageType));
    formData.append("ContentFile", data.contentFile);
    formData.append("CondominiumId", data.condominiumId);
    formData.append("CondominiumUnitId", data.condominiumUnitId);
    formData.append("UserId", data.userId);

    if (data.licensePlate) formData.append("LicensePlate", data.licensePlate);
    if (data.vehicleManufacturer)
      formData.append("VehicleManufacturer", data.vehicleManufacturer);
    if (data.vehicleModel) formData.append("VehicleModel", data.vehicleModel);

    return apiClient.post<{ condominiumUnitImageId: string }>(
      this.baseUrl,
      formData,
    );
  }

  async uploadVehicleImage(data: CondominiumUnitImageUpload) {
    const formData = new FormData();
    formData.append("ImageType", String(data.imageType));
    formData.append("ContentFile", data.contentFile);
    formData.append("CondominiumId", data.condominiumId);
    formData.append("CondominiumUnitId", data.condominiumUnitId);
    formData.append("UserId", data.userId);
    if (data.licensePlate) formData.append("LicensePlate", data.licensePlate);
    if (data.vehicleManufacturer)
      formData.append("VehicleManufacturer", data.vehicleManufacturer);
    if (data.vehicleModel) formData.append("VehicleModel", data.vehicleModel);
    return apiClient.post<{ condominiumUnitImageId: string }>(
      `${this.baseUrl}/vehicles`,
      formData,
    );
  }

  async getUnitImages(
    condominiumId: string,
    condominiumUnitId: string,
    imageType?: UnitImageTypeQuery,
  ) {
    const params = new URLSearchParams({
      CondominiumId: condominiumId,
      CondominiumUnitId: condominiumUnitId,
      ...(imageType && { ImageType: String(imageType) }),
    });
    return apiClient.get<CondominiumUnitImage[]>(`${this.baseUrl}?${params}`);
  }

  async getUnitImageById(id: string) {
    return apiClient.get<CondominiumUnitImage>(`${this.baseUrl}/${id}`);
  }

  async getUnitImageTypes() {
    return apiClient.get<UnitImageTypeEnum[]>(`${this.baseUrl}/types`);
  }

  async downloadUnitImage(id: string) {
    return apiClient.get<{
      contentType: string;
      contentFile: string;
      fileName: string;
    }>(`${this.baseUrl}/${id}/download`);
  }
}

export const condominiumUnitImageService = new CondominiumUnitImageService();
declare global {
  interface Window {
    condominiumUnitImageService: CondominiumUnitImageService;
  }
}
if (typeof window !== "undefined") {
  window.condominiumUnitImageService = condominiumUnitImageService;
}
