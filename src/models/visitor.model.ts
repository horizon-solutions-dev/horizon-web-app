import type { PagedResponse } from "./pagination.model";

export interface VisitorEnum {
  id: number | string;
  value: string;
  description: string;
}

export interface CreateVisitorRequest {
  name: string;
  documentType?: number | string;
  documentNumber: string;
  phone: string;
  email: string;
  visitorTypeId?: number | string;
  facePhoto: File;
  documentPhoto: File;
  commit: boolean;
}

export interface CreateVisitorResponse {
  visitorId: string;
}

export interface VisitorResponse {
  visitorId: string;
  name: string;
  documentType?: number | string;
  documentNumber: string;
  phone: string;
  email: string;
  visitorTypeId?: number | string;
  visitorType?: string;
  facePhoto?: string;
  facePhotoContentType?: string;
  facePhotoThumbnailFile?: string;
  documentPhoto?: string;
  documentPhotoContentType?: string;
  documentPhotoThumbnailFile?: string;
  entryAt?: string;
  exitAt?: string | null;
  finished?: boolean;
  active?: boolean;
  createdAt?: string;
  createdBy?: string;
  createdByName?: string;
  updatedAt?: string;
  updatedBy?: string;
  updatedByName?: string;
  visitorHistoryId?: string;
}

export type VisitorPagedResponse = PagedResponse<VisitorResponse>;

export interface VisitorAccessPermissionRequest {
  visitorId: string;
  areaId: string;
  active: boolean;
}

export interface CreateVisitorVisitRequest {
  entryAt: string;
  exitAt?: string | null;
  releasedByResident: boolean;
  typeVisitorReasonId: string | number;
  notes?: string;
  visitorId: string;
  condominiumId: string;
  condominiumUnitId: string;
  condominiumUnitResidentId: string;
  visitorAccessPermissions: VisitorAccessPermissionRequest[];
  commit: boolean;
}

export interface CreateVisitorVisitResponse {
  visitorHistoryId: string;
}

export interface FinishVisitorVisitResponse {
  visitorHistoryId: string;
}
