/**
 * OAuth2 Token Response from API
 * Represents the raw response from OAuth2 token endpoint
 */
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

/**
 * Token Data stored internally
 * Includes calculated expiration timestamp
 */
export interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number; // timestamp when token expires
  token_type: string;
}

/**
 * Token Management Result
 * Used by activities to handle token refresh operations
 */
export interface TokenManagementResult {
  success: boolean;
  currentRefreshToken?: string;
  newRefreshToken?: string;
  message: string;
  tokenExpiry?: Date;
}

/**
 * Token Information
 * Used for token validation and status checks
 */
export interface TokenInfo {
  hasValidToken: boolean;
  tokenExpiry?: Date;
  refreshTokenChanged: boolean;
}
