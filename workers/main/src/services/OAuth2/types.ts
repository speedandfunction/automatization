export interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  token_type: string;
}

export interface TokenStorageProvider {
  save(tokenData: TokenData): Promise<void>;
  load(): Promise<TokenData | null>;
  clear(): Promise<void>;
}

export interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  tokenHost: string;
  tokenPath: string;
  authorizeHost?: string;
  authorizePath?: string;
  tokenExpirationWindowSeconds: number;
}
