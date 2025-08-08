import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { OAuth2TokenManager } from './OAuth2TokenManager';
import { TokenData } from './types';

vi.mock('./FileTokenStorage', () => ({
  FileTokenStorage: vi.fn().mockImplementation(() => ({
    save: vi.fn().mockResolvedValue(undefined),
    load: vi.fn().mockResolvedValue(null),
    clear: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('./OAuth2TokenRefreshProvider', () => ({
  OAuth2TokenRefreshProvider: vi.fn().mockImplementation(() => ({
    refreshToken: vi.fn().mockResolvedValue({
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
      expires_at: Date.now() + 3600000,
      token_type: 'Bearer',
    }),
  })),
}));

vi.mock('../../configs/qbo', () => ({
  qboConfig: {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    refreshToken: 'test-refresh-token',
    tokenUrl: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
  },
}));

describe('OAuth2TokenManager - Error Handling', () => {
  let tokenManager: OAuth2TokenManager;

  beforeEach(async () => {
    tokenManager = new OAuth2TokenManager('qbo', 'test-refresh-token');
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('token validation', () => {
    it('should return false for empty access token', () => {
      const tokenData: TokenData = {
        access_token: '',
        refresh_token: 'refresh-token',
        expires_at: Date.now() + 3600000,
        token_type: 'Bearer',
      };

      tokenManager.setTokenDataForTesting(tokenData);
      expect(tokenManager.isTokenValid()).toBe(false);
    });

    it('should return false for null access token', () => {
      const tokenData: TokenData = {
        access_token: null as unknown as string,
        refresh_token: 'refresh-token',
        expires_at: Date.now() + 3600000,
        token_type: 'Bearer',
      };

      tokenManager.setTokenDataForTesting(tokenData);
      expect(tokenManager.isTokenValid()).toBe(false);
    });

    it('should return false for expired token', () => {
      const tokenData: TokenData = {
        access_token: 'expired-token',
        refresh_token: 'refresh-token',
        expires_at: Date.now() - 3600000,
        token_type: 'Bearer',
      };

      tokenManager.setTokenDataForTesting(tokenData);
      expect(tokenManager.isTokenValid()).toBe(false);
    });

    it('should return true for valid token', () => {
      const tokenData: TokenData = {
        access_token: 'valid-token',
        refresh_token: 'refresh-token',
        expires_at: Date.now() + 3600000,
        token_type: 'Bearer',
      };

      tokenManager.setTokenDataForTesting(tokenData);
      expect(tokenManager.isTokenValid()).toBe(true);
    });
  });

  describe('refresh token handling', () => {
    it('should return default refresh token when no cached token', () => {
      expect(tokenManager.getCurrentRefreshToken()).toBe('test-refresh-token');
    });

    it('should return cached refresh token when available', () => {
      const tokenData: TokenData = {
        access_token: 'test-access-token',
        refresh_token: 'cached-refresh-token',
        expires_at: Date.now() + 3600000,
        token_type: 'Bearer',
      };

      tokenManager.setTokenDataForTesting(tokenData);
      expect(tokenManager.getCurrentRefreshToken()).toBe(
        'cached-refresh-token',
      );
    });
  });

  describe('edge cases', () => {
    it('should handle negative expiry date', () => {
      const tokenData: TokenData = {
        access_token: 'valid-token',
        refresh_token: 'refresh-token',
        expires_at: -1000,
        token_type: 'Bearer',
      };

      tokenManager.setTokenDataForTesting(tokenData);
      expect(tokenManager.isTokenValid()).toBe(false);
    });

    it('should handle zero expiry date', () => {
      const tokenData: TokenData = {
        access_token: 'valid-token',
        refresh_token: 'refresh-token',
        expires_at: 0,
        token_type: 'Bearer',
      };

      tokenManager.setTokenDataForTesting(tokenData);
      expect(tokenManager.isTokenValid()).toBe(false);
    });

    it('should handle very small expiry date', () => {
      const tokenData: TokenData = {
        access_token: 'valid-token',
        refresh_token: 'refresh-token',
        expires_at: Number.MIN_SAFE_INTEGER,
        token_type: 'Bearer',
      };

      tokenManager.setTokenDataForTesting(tokenData);
      expect(tokenManager.isTokenValid()).toBe(false);
    });
  });
});
