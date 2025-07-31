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
