import { apiClient } from "./apiClient";

export interface VerificationValidateResponse {
  emailMessageQueueId?: string;
  tokenCode?: string;
  createAt?: string;
  createBy?: string;
}

class VerificationService {
  private baseUrl =
    "https://horizondigitalapi-fcgsehgwa7a5hpaf.australiaeast-01.azurewebsites.net/api/v1/verifications";

  async validateCode(code: string) {
    return apiClient.get<VerificationValidateResponse>(
      `${this.baseUrl}/validate/${code}`,
    );
  }
}

export const verificationService = new VerificationService();
