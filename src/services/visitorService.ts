import axios from "axios";
import { apiClient } from "./apiClient";
import type {
  CreateVisitorRequest,
  CreateVisitorResponse,
  CreateVisitorVisitRequest,
  CreateVisitorVisitResponse,
  FinishVisitorVisitResponse,
  VisitorEnum,
  VisitorPagedResponse,
  VisitorResponse,
} from "../models/visitor.model";
import { normalizePagedResponse, type LegacyPagedResponse } from "../shared/utils/pagination";

class VisitorService {
  private baseUrl =
    "https://horizondigitalapi-fcgsehgwa7a5hpaf.australiaeast-01.azurewebsites.net/api/v1/visitors";

  async createVisitor(visitor: CreateVisitorRequest) {
    const formData = new FormData();
    formData.append("Name", visitor.name);
    if (visitor.documentType !== undefined && visitor.documentType !== "") {
      formData.append("DocumentType", String(visitor.documentType));
    }
    formData.append("DocumentNumber", visitor.documentNumber);
    formData.append("Phone", visitor.phone);
    formData.append("Email", visitor.email);
    if (visitor.visitorTypeId !== undefined && visitor.visitorTypeId !== "") {
      formData.append("VisitorTypeId", String(visitor.visitorTypeId));
    }
    formData.append("FacePhoto", visitor.facePhoto);
    formData.append("DocumentPhoto", visitor.documentPhoto);
    formData.append("Commit", String(visitor.commit));

    return await apiClient.post<CreateVisitorResponse>(this.baseUrl, formData);
  }

  async validateVisitor(visitor: CreateVisitorRequest) {
    try {
      await this.createVisitor({ ...visitor, commit: false });
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

  async getVisitors(condominiumId: string, pageNumber?: number, pageSize?: number) {
    const params = new URLSearchParams({
      Id: condominiumId,
      ...(pageNumber !== undefined && { PageNumber: pageNumber.toString() }),
      ...(pageSize !== undefined && { PageSize: pageSize.toString() }),
    });

    const response = await apiClient.get<
      VisitorResponse[] | VisitorPagedResponse | LegacyPagedResponse<VisitorResponse>
    >(`${this.baseUrl}?${params}`);

    return normalizePagedResponse(response, pageNumber, pageSize);
  }

  async getVisitorById(id: string) {
    return await apiClient.get<VisitorResponse>(`${this.baseUrl}/${id}`);
  }

  async getVisitorTypes() {
    return await apiClient.get<VisitorEnum[]>(`${this.baseUrl}/types`);
  }

  async getVisitorReasons() {
    return await apiClient.get<VisitorEnum[]>(`${this.baseUrl}/reasons`);
  }

  async createVisit(visit: CreateVisitorVisitRequest) {
    return await apiClient.post<CreateVisitorVisitResponse>(
      `${this.baseUrl}/visits`,
      visit,
    );
  }

  async finishVisit(id: string) {
    return await apiClient.patch<FinishVisitorVisitResponse>(
      `${this.baseUrl}/visits/${id}/finish`,
    );
  }
}

export const visitorService = new VisitorService();
