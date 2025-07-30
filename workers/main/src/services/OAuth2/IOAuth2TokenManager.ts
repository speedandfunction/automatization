import { TokenData } from './types';

/**
 * Interface for token storage providers
 * Handles saving and loading token data to/from persistent storage
 */
export interface TokenStorageProvider {
  /**
   * Save token data to storage
   * @param tokenData - The token data to save
   */
  save(tokenData: TokenData): Promise<void>;

  /**
   * Load token data from storage
   * @returns TokenData if available, null otherwise
   */
  load(): TokenData | null;

  /**
   * Clear stored token data
   */
  clear(): Promise<void>;
}

/**
 * Interface for token refresh providers
 * Handles refreshing access tokens using refresh tokens
 */
export interface TokenRefreshProvider {
  /**
   * Refresh access token using refresh token
   * @param refreshToken - The refresh token to use
   * @returns Promise resolving to new TokenData
   */
  refreshToken(refreshToken: string): Promise<TokenData>;
}

/**
 * Interface for OAuth2 token manager
 * Main interface for token management operations
 */
export interface IOAuth2TokenManager {
  /**
   * Get a valid access token, refreshing if necessary
   * @returns Promise resolving to access token string
   */
  getAccessToken(): Promise<string>;

  /**
   * Get the current refresh token
   * @returns refresh token string
   */
  getCurrentRefreshToken(): string;

  /**
   * Check if current token is valid
   * @returns boolean indicating if token is valid
   */
  isTokenValid(): boolean;
}
