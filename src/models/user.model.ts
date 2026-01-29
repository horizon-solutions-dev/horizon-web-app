export interface DecodedUser {
  sub: string; // ID do usuário
  email: string;
  name: string; // Nome do usuário
  role: string; // Cargo/Role do usuário
  iat?: number; // Issued at
  exp?: number; // Expiration time
  aud?: string; // Audience
  iss?: string; // Issuer
  [key: string]: unknown; // Permitir outras propriedades do JWT
}

export interface UserInfo {
  name: string;
  email: string;
  role: string;
}


export interface AuthTokenPayload {
  Doc: string;                       // CPF ou CNPJ
  DocType: 'CPF' | 'CNPJ';
  Fullname: string;
  Name: string;
  LanguageId: string;                // ex: 'pt-br'
  RefreshTokenExpiresAt: string;     // formato: YYYY/MM/DD HH:mm:ss
  TokenExpiresAt: string;            // formato: YYYY/MM/DD HH:mm:ss
  RemoteIpAddress: string;           // IP:PORT
  UserId: string;                    // UUID
  aud: string;                       // audience
  iss: string;                       // issuer
  exp: number;                       // unix timestamp (seconds)
}
