import type { PagedResponse } from "./pagination.model";

export interface AreaEnum {
  id: number | string;
  value: string;
  description: string;
}

export interface AreaRequest {
  name: string;
  type: string | number;
  sizeM2: number;
  capacityPeople: number;
  startTime: string;
  endTime: string;
  operatingDays: string;
  hasReservationPrice: boolean;
  hasApprovalRequired: boolean;
  hasFee: boolean;
  feeAmount: number;
  hasDeposit: boolean;
  depositAmount: number;
  hasAllowsGuests: boolean;
  guestLimit: number;
  notes: string;
  condominiumId: string;
  commit: boolean;
}

export interface AreaResponse extends AreaRequest {
  areaId: string;
  imageType?: string;
  contentType?: string;
  thumbnailFile?: string;
  active?: boolean;
}

export type AreaPagedResponse = PagedResponse<AreaResponse>;

export type AreaImageType = "Main" | "Angle1" | "Angle2" | "Detail" | string;

export interface AreaImageResponse {
  areaImageId: string;
  imageType: AreaImageType;
  contentType: string;
  contentFile: string;
  areaId: string;
}

export interface AreaImageDownloadResponse {
  contentType: string;
  contentFile: string;
  fileName: string;
}
