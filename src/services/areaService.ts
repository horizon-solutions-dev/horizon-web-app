import axios from "axios";
import { apiClient } from "./apiClient";
import type {
  AreaEnum,
  AreaPagedResponse,
  AreaRequest,
  AreaResponse,
} from "../models/area.model";
import { normalizePagedResponse, type LegacyPagedResponse } from "../shared/utils/pagination";

class AreaService {
  private baseUrl =
    "https://horizondigitalapi-fcgsehgwa7a5hpaf.australiaeast-01.azurewebsites.net/api/v1/areas";

  private handleValidationError(error: unknown) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 422) {
        const data = error.response?.data as
          | { validations?: Array<{ field: string; message: string }> }
          | undefined;
        return { valid: false, validations: data?.validations ?? [] };
      }

      const data = error.response?.data as
        | { friendlyMessage?: string; message?: string }
        | undefined;
      const message = data?.friendlyMessage || data?.message || "";
      if (error.response?.status === 404 && message.includes("Nada encontrado")) {
        return { valid: true, validations: [] as Array<{ field: string; message: string }> };
      }
    }

    throw error;
  }

  async createArea(area: AreaRequest) {
    return await apiClient.post<{ areaId: string }>(this.baseUrl, area);
  }

  async validateArea(area: AreaRequest) {
    try {
      await apiClient.post<{ areaId?: string }>(this.baseUrl, {
        ...area,
        commit: false,
      });
      return { valid: true, validations: [] as Array<{ field: string; message: string }> };
    } catch (error) {
      return this.handleValidationError(error);
    }
  }

  async validateAreaEdit(id: string, area: AreaRequest) {
    try {
      await apiClient.put<{ areaId?: string }>(`${this.baseUrl}/${id}`, {
        ...area,
        commit: false,
      });
      return { valid: true, validations: [] as Array<{ field: string; message: string }> };
    } catch (error) {
      return this.handleValidationError(error);
    }
  }

  async updateArea(id: string, area: AreaRequest) {
    return await apiClient.put<{ areaId: string }>(`${this.baseUrl}/${id}`, area);
  }

  async deleteArea(id: string) {
    return await apiClient.delete<{ areaId: string }>(`${this.baseUrl}/${id}`);
  }

  async getAreas(condominiumId: string, pageNumber?: number, pageSize?: number) {
    const params = new URLSearchParams({
      Id: condominiumId,
      ...(pageNumber !== undefined && { PageNumber: pageNumber.toString() }),
      ...(pageSize !== undefined && { PageSize: pageSize.toString() }),
    });
    const response = await apiClient.get<
      AreaResponse[] | AreaPagedResponse | LegacyPagedResponse<AreaResponse>
    >(`${this.baseUrl}?${params}`);

    return normalizePagedResponse(response, pageNumber, pageSize);
  }

  async getAreaById(id: string) {
    return await apiClient.get<AreaResponse>(`${this.baseUrl}/${id}`);
  }

  async getAreaTypes() {
    return await apiClient.get<AreaEnum[]>(`${this.baseUrl}/types`);
  }
}

export const areaService = new AreaService();
