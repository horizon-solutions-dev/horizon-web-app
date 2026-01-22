// Auth Models
export interface LoginRequest {
  login: string;
  pass: string;
  dataSource: string;
  languageId: string;
  version: string;
}

export interface LoginResponse {
  token: string;
  tokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  message: string;
}

export interface RefreshTokenRequest {
  token: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  token: string;
  tokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  message: string;
}

export interface PasswordRecoveryRequest {
  email: string;
}

export interface PasswordRecoveryResponse {
  message: string;
  success: boolean;
}

export interface VerifyRecoveryCodeRequest {
  email: string;
  code: string;
}

export interface VerifyRecoveryCodeResponse {
  message: string;
  success: boolean;
  token?: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
  success: boolean;
}

// Account Models
export interface CreateAccountRequest {
  name: string;
  surname: string;
  docType: 'CPF' | 'CNPJ' | 'PASS';
  doc: string;
  email: string;
  phone: string;
}

export interface UpdateAccountRequest {
  name: string;
  surname: string;
  docType: 'CPF' | 'CNPJ' | 'PASS';
  doc: string;
  email: string;
  phone: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface AccountResponse {
  userId: string;
  name: string;
  surname: string;
  docType: 'CPF' | 'CNPJ' | 'PASS';
  doc: string;
  email: string;
  phone: string;
}

export interface CreateAccountResponse {
  userId: string;
  message: string;
}

// Error Response
export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
  statusCode: number;
}
