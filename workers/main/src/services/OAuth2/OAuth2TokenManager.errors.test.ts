import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { OAuth2TokenManager } from './OAuth2TokenManager';
import { TokenData } from './types';

vi.mock('./FileTokenStorage', () => ({
  FileTokenStorage: vi.fn().mockImplementation(() => ({
    save: vi.fn().mockResolvedValue(undefined),
    load: vi.fn().mockReturnValue(null),
    clear: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('./OAuth2TokenRefreshProvider');

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

  beforeEach(() => {
    tokenManager = new OAuth2TokenManager('qbo', 'test-refresh-token');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getAccessToken error scenarios', () => {
    it('should throw error when no access token available after refresh', async () => {
      const { OAuth2TokenRefreshProvider } = await import(
        './OAuth2TokenRefreshProvider'
      );

      // @ts-expect-error - Mock only needs to implement used methods
      vi.mocked(OAuth2TokenRefreshProvider).mockImplementation(() => ({
        refreshToken: vi.fn().mockRejectedValue(new Error('Refresh failed')),
      }));

      const expiredTokenData: TokenData = {
        access_token: 'expired-access-token',
        refresh_token: 'refresh-token',
        expires_at: Date.now() - 3600000,
        token_type: 'Bearer',
      };

      tokenManager.setTokenDataForTesting(expiredTokenData);

      await expect(tokenManager.getAccessToken()).rejects.toThrow(
        'Failed to obtain access token',
      );
    });

    it('should handle empty access token after refresh', async () => {
      const { OAuth2TokenRefreshProvider } = await import(
        './OAuth2TokenRefreshProvider'
      );

      // @ts-expect-error - Mock only needs to implement used methods
      vi.mocked(OAuth2TokenRefreshProvider).mockImplementation(() => ({
        refreshToken: vi.fn().mockResolvedValue({
          access_token: '',
          refresh_token: 'new-refresh-token',
          expires_at: Date.now() + 3600000,
          token_type: 'Bearer',
        }),
      }));

      const expiredTokenData: TokenData = {
        access_token: 'expired-access-token',
        refresh_token: 'refresh-token',
        expires_at: Date.now() - 3600000,
        token_type: 'Bearer',
      };

      tokenManager.setTokenDataForTesting(expiredTokenData);

      await expect(tokenManager.getAccessToken()).rejects.toThrow(
        'Failed to obtain access token',
      );
    });
  });

  describe('token refresh logic', () => {
    it('should handle refresh token failure with invalid token error', async () => {
      const { OAuth2TokenRefreshProvider } = await import(
        './OAuth2TokenRefreshProvider'
      );

      // @ts-expect-error - Mock only needs to implement used methods
      vi.mocked(OAuth2TokenRefreshProvider).mockImplementation(() => ({
        refreshToken: vi
          .fn()
          .mockRejectedValue(new Error('invalid or expired refresh token')),
      }));

      const expiredTokenData: TokenData = {
        access_token: 'expired-access-token',
        refresh_token: 'refresh-token',
        expires_at: Date.now() - 3600000,
        token_type: 'Bearer',
      };

      tokenManager.setTokenDataForTesting(expiredTokenData);

      await expect(tokenManager.getAccessToken()).rejects.toThrow(
        'invalid or expired refresh token',
      );

      expect(tokenManager.isTokenValid()).toBe(false);
      expect(tokenManager.getCurrentRefreshToken()).toBe('test-refresh-token');
    });

    it('should handle refresh token failure with other errors', async () => {
      const { OAuth2TokenRefreshProvider } = await import(
        './OAuth2TokenRefreshProvider'
      );

      // @ts-expect-error - Mock only needs to implement used methods
      vi.mocked(OAuth2TokenRefreshProvider).mockImplementation(() => ({
        refreshToken: vi.fn().mockRejectedValue(new Error('Network error')),
      }));

      const expiredTokenData: TokenData = {
        access_token: 'expired-access-token',
        refresh_token: 'refresh-token',
        expires_at: Date.now() - 3600000,
        token_type: 'Bearer',
      };

      tokenManager.setTokenDataForTesting(expiredTokenData);

      await expect(tokenManager.getAccessToken()).rejects.toThrow(
        'Network error',
      );
    });
  });
});
