export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  token_type: string;
}

export interface TokenStorageProvider {
  save(tokenData: TokenData): Promise<void>;

  load(): TokenData | null;

  clear(): Promise<void>;
}

export interface TokenRefreshProvider {
  refreshToken(refreshToken: string): Promise<TokenData>;
}

export interface OAuth2TokenManagerInterface {
  getAccessToken(): Promise<string>;

  getCurrentRefreshToken(): string;

  isTokenValid(): boolean;
}
