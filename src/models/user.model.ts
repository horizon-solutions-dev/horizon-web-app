import type {
  AppPermission,
  AppRole,
  AuthorizationSnapshot,
} from "../rbac/types";

export interface DecodedUser {
  sub: string;
  email: string;
  name: string;
  role: string;
  iat?: number;
  exp?: number;
  aud?: string;
  iss?: string;
  [key: string]: unknown;
}

export interface UserInfo {
  name: string;
  email: string;
  role: string;
  profileCode?: string;
  roles: AppRole[];
  permissions: AppPermission[];
}


export interface AuthTokenPayload {
  Doc: string;
  DocType: "CPF" | "CNPJ";
  Fullname: string;
  Name: string;
  LanguageId: string;
  RefreshTokenExpiresAt: string;
  TokenExpiresAt: string;
  RemoteIpAddress: string;
  UserId: string;
  aud: string;
  iss: string;
  exp: number;
  Role?: string;
  Roles?: string[] | string;
  ProfileCode?: string;
}

export type UserAuthorization = AuthorizationSnapshot;
