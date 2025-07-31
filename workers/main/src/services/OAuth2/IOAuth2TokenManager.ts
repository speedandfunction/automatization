import { TokenData } from './types';

export interface TokenStorageProvider {
  save(tokenData: TokenData): Promise<void>;

  load(): TokenData | null;

  clear(): Promise<void>;
}

export interface TokenRefreshProvider {
  refreshToken(refreshToken: string): Promise<TokenData>;
}

export interface IOAuth2TokenManager {
  getAccessToken(): Promise<string>;

  getCurrentRefreshToken(): string;

  isTokenValid(): boolean;
}
