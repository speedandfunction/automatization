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

vi.mock('./OAuth2TokenRefreshProvider', () => ({
  OAuth2TokenRefreshProvider: vi.fn().mockImplementation(() => ({
    refreshToken: vi.fn().mockResolvedValue({
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
      expires_at: Date.now() + 3600000,
      token_type: 'Bearer',
    }),
  })) as any,
}));

vi.mock('../../configs/qbo', () => ({
  qboConfig: {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    refreshToken: 'test-refresh-token',
    tokenUrl: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
  },
}));

describe('OAuth2TokenManager', () => {
  let tokenManager: OAuth2TokenManager;

  beforeEach(() => {
    tokenManager = new OAuth2TokenManager('qbo', 'test-refresh-token');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('constructor', () => {
    it('should create OAuth2TokenManager instance', () => {
      expect(tokenManager).toBeInstanceOf(OAuth2TokenManager);
    });

    it('should create OAuth2TokenManager with custom service name', () => {
      const customTokenManager = new OAuth2TokenManager(
        'custom-service',
        'custom-refresh-token',
      );

      expect(customTokenManager).toBeInstanceOf(OAuth2TokenManager);
    });
  });

  describe('isTokenValid', () => {
    it('should return false when no token is set', () => {
      expect(tokenManager.isTokenValid()).toBe(false);
    });

    it('should return false when token is expired', () => {
      const expiredTokenData: TokenData = {
        access_token: 'expired-token',
        refresh_token: 'refresh-token',
        expires_at: Date.now() - 3600000,
        token_type: 'Bearer',
      };

      const setTokenData = (
        tokenManager as unknown as { setTokenData: (data: TokenData) => void }
      ).setTokenData.bind(tokenManager);

      setTokenData(expiredTokenData);

      expect(tokenManager.isTokenValid()).toBe(false);
    });

    it('should return true when token is valid', () => {
      const validTokenData: TokenData = {
        access_token: 'valid-token',
        refresh_token: 'refresh-token',
        expires_at: Date.now() + 3600000,
        token_type: 'Bearer',
      };

      const setTokenData = (
        tokenManager as unknown as { setTokenData: (data: TokenData) => void }
      ).setTokenData.bind(tokenManager);

      setTokenData(validTokenData);

      expect(tokenManager.isTokenValid()).toBe(true);
    });
  });

  describe('getCurrentRefreshToken', () => {
    it('should return refresh token from config when no cached token', async () => {
      const refreshToken = tokenManager.getCurrentRefreshToken();

      expect(refreshToken).toBe('test-refresh-token');
    });

    it('should return cached refresh token when available', () => {
      const tokenData: TokenData = {
        access_token: 'test-access-token',
        refresh_token: 'cached-refresh-token',
        expires_at: Date.now() + 3600000,
        token_type: 'Bearer',
      };

      const setTokenData = (
        tokenManager as unknown as { setTokenData: (data: TokenData) => void }
      ).setTokenData.bind(tokenManager);

      setTokenData(tokenData);

      const refreshToken = tokenManager.getCurrentRefreshToken();

      expect(refreshToken).toBe('cached-refresh-token');
    });
  });

  describe('getAccessToken', () => {
    it('should return cached access token when valid', async () => {
      const tokenData: TokenData = {
        access_token: 'valid-access-token',
        refresh_token: 'refresh-token',
        expires_at: Date.now() + 3600000,
        token_type: 'Bearer',
      };

      const setTokenData = (
        tokenManager as unknown as { setTokenData: (data: TokenData) => void }
      ).setTokenData.bind(tokenManager);

      setTokenData(tokenData);

      const accessToken = await tokenManager.getAccessToken();

      expect(accessToken).toBe('valid-access-token');
    });

    it('should refresh token when expired and return new access token', async () => {
      const expiredTokenData: TokenData = {
        access_token: 'expired-access-token',
        refresh_token: 'refresh-token',
        expires_at: Date.now() - 3600000,
        token_type: 'Bearer',
      };

      const setTokenData = (
        tokenManager as unknown as { setTokenData: (data: TokenData) => void }
      ).setTokenData.bind(tokenManager);

      setTokenData(expiredTokenData);

      const accessToken = await tokenManager.getAccessToken();

      expect(accessToken).toBe('new-access-token');
    });

    it('should throw error when no access token available after refresh', async () => {
      const { OAuth2TokenRefreshProvider } = await import(
        './OAuth2TokenRefreshProvider'
      );

      vi.mocked(OAuth2TokenRefreshProvider).mockImplementation(() => ({
        refreshToken: vi.fn().mockRejectedValue(new Error('Refresh failed')),
      })) as any;

      const expiredTokenData: TokenData = {
        access_token: 'expired-access-token',
        refresh_token: 'refresh-token',
        expires_at: Date.now() - 3600000,
        token_type: 'Bearer',
      };

      const setTokenData = (
        tokenManager as unknown as { setTokenData: (data: TokenData) => void }
      ).setTokenData.bind(tokenManager);

      setTokenData(expiredTokenData);

      await expect(tokenManager.getAccessToken()).rejects.toThrow(
        'Failed to obtain access token',
      );
    });

    it('should handle empty access token after refresh', async () => {
      const { OAuth2TokenRefreshProvider } = await import(
        './OAuth2TokenRefreshProvider'
      );

      vi.mocked(OAuth2TokenRefreshProvider).mockImplementation(() => ({
        refreshToken: vi.fn().mockResolvedValue({
          access_token: '',
          refresh_token: 'new-refresh-token',
          expires_at: Date.now() + 3600000,
          token_type: 'Bearer',
        }),
      })) as any;

      const expiredTokenData: TokenData = {
        access_token: 'expired-access-token',
        refresh_token: 'refresh-token',
        expires_at: Date.now() - 3600000,
        token_type: 'Bearer',
      };

      const setTokenData = (
        tokenManager as unknown as { setTokenData: (data: TokenData) => void }
      ).setTokenData.bind(tokenManager);

      setTokenData(expiredTokenData);

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
      const { FileTokenStorage } = await import('./FileTokenStorage');

      vi.mocked(OAuth2TokenRefreshProvider).mockImplementation(() => ({
        refreshToken: vi
          .fn()
          .mockRejectedValue(new Error('invalid or expired refresh token')),
      })) as any;

      const expiredTokenData: TokenData = {
        access_token: 'expired-access-token',
        refresh_token: 'refresh-token',
        expires_at: Date.now() - 3600000,
        token_type: 'Bearer',
      };

      const setTokenData = (
        tokenManager as unknown as { setTokenData: (data: TokenData) => void }
      ).setTokenData.bind(tokenManager);

      setTokenData(expiredTokenData);

      await expect(tokenManager.getAccessToken()).rejects.toThrow(
        'invalid or expired refresh token',
      );

      // Verify that tokens were cleared
      expect(tokenManager.isTokenValid()).toBe(false);
      expect(tokenManager.getCurrentRefreshToken()).toBe('test-refresh-token');
    });

    it('should handle refresh token failure with other errors', async () => {
      const { OAuth2TokenRefreshProvider } = await import(
        './OAuth2TokenRefreshProvider'
      );

      vi.mocked(OAuth2TokenRefreshProvider).mockImplementation(() => ({
        refreshToken: vi.fn().mockRejectedValue(new Error('Network error')),
      })) as any;

      const expiredTokenData: TokenData = {
        access_token: 'expired-access-token',
        refresh_token: 'refresh-token',
        expires_at: Date.now() - 3600000,
        token_type: 'Bearer',
      };

      const setTokenData = (
        tokenManager as unknown as { setTokenData: (data: TokenData) => void }
      ).setTokenData.bind(tokenManager);

      setTokenData(expiredTokenData);

      await expect(tokenManager.getAccessToken()).rejects.toThrow(
        'Network error',
      );
    });

    it('should save tokens after successful refresh', async () => {
      const { FileTokenStorage } = await import('./FileTokenStorage');
      const mockSave = vi.fn().mockResolvedValue(undefined);

      vi.mocked(FileTokenStorage).mockImplementation(() => ({
        save: mockSave,
        load: vi.fn().mockReturnValue(null),
        clear: vi.fn().mockResolvedValue(undefined),
      }));

      const expiredTokenData: TokenData = {
        access_token: 'expired-access-token',
        refresh_token: 'refresh-token',
        expires_at: Date.now() - 3600000,
        token_type: 'Bearer',
      };

      const setTokenData = (
        tokenManager as unknown as { setTokenData: (data: TokenData) => void }
      ).setTokenData.bind(tokenManager);

      setTokenData(expiredTokenData);

      await tokenManager.getAccessToken();

      expect(mockSave).toHaveBeenCalledWith({
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_at: expect.any(Number),
        token_type: 'Bearer',
      });
    });

    it('should not save tokens when refresh returns invalid data', async () => {
      const { OAuth2TokenRefreshProvider } = await import(
        './OAuth2TokenRefreshProvider'
      );
      const { FileTokenStorage } = await import('./FileTokenStorage');
      const mockSave = vi.fn().mockResolvedValue(undefined);

      vi.mocked(OAuth2TokenRefreshProvider).mockImplementation(() => ({
        refreshToken: vi.fn().mockResolvedValue({
          access_token: '',
          refresh_token: '',
          expires_at: Date.now() + 3600000,
          token_type: 'Bearer',
        }),
      })) as any;

      vi.mocked(FileTokenStorage).mockImplementation(() => ({
        save: mockSave,
        load: vi.fn().mockReturnValue(null),
        clear: vi.fn().mockResolvedValue(undefined),
      }));

      const expiredTokenData: TokenData = {
        access_token: 'expired-access-token',
        refresh_token: 'refresh-token',
        expires_at: Date.now() - 3600000,
        token_type: 'Bearer',
      };

      const setTokenData = (
        tokenManager as unknown as { setTokenData: (data: TokenData) => void }
      ).setTokenData.bind(tokenManager);

      setTokenData(expiredTokenData);

      await expect(tokenManager.getAccessToken()).rejects.toThrow(
        'Failed to obtain access token',
      );

      expect(mockSave).not.toHaveBeenCalled();
    });
  });

  describe('concurrent access scenarios', () => {
    it('should handle concurrent getAccessToken calls with expired token', async () => {
      const { OAuth2TokenRefreshProvider } = await import(
        './OAuth2TokenRefreshProvider'
      );
      let refreshCallCount = 0;

      vi.mocked(OAuth2TokenRefreshProvider).mockImplementation(() => ({
        refreshToken: vi.fn().mockImplementation(async () => {
          refreshCallCount++;
          await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate network delay

          return {
            access_token: 'new-access-token',
            refresh_token: 'new-refresh-token',
            expires_at: Date.now() + 3600000,
            token_type: 'Bearer',
          };
        }),
      }));

      const expiredTokenData: TokenData = {
        access_token: 'expired-access-token',
        refresh_token: 'refresh-token',
        expires_at: Date.now() - 3600000,
        token_type: 'Bearer',
      };

      const setTokenData = (
        tokenManager as unknown as { setTokenData: (data: TokenData) => void }
      ).setTokenData.bind(tokenManager);

      setTokenData(expiredTokenData);

      // Make concurrent calls
      const promises = [
        tokenManager.getAccessToken(),
        tokenManager.getAccessToken(),
        tokenManager.getAccessToken(),
      ];

      const results = await Promise.all(promises);

      // All calls should return the same token
      expect(results).toEqual([
        'new-access-token',
        'new-access-token',
        'new-access-token',
      ]);

      // Refresh should only be called once due to refreshPromise protection
      expect(refreshCallCount).toBe(1);
    });

    it('should handle concurrent getAccessToken calls with valid token', async () => {
      const validTokenData: TokenData = {
        access_token: 'valid-access-token',
        refresh_token: 'refresh-token',
        expires_at: Date.now() + 3600000,
        token_type: 'Bearer',
      };

      const setTokenData = (
        tokenManager as unknown as { setTokenData: (data: TokenData) => void }
      ).setTokenData.bind(tokenManager);

      setTokenData(validTokenData);

      // Make concurrent calls
      const promises = [
        tokenManager.getAccessToken(),
        tokenManager.getAccessToken(),
        tokenManager.getAccessToken(),
      ];

      const results = await Promise.all(promises);

      // All calls should return the same token without refresh
      expect(results).toEqual([
        'valid-access-token',
        'valid-access-token',
        'valid-access-token',
      ]);
    });
  });

  describe('storage provider integration', () => {
    it('should load tokens from storage on initialization', async () => {
      const { FileTokenStorage } = await import('./FileTokenStorage');
      const storedTokenData: TokenData = {
        access_token: 'stored-access-token',
        refresh_token: 'stored-refresh-token',
        expires_at: Date.now() + 3600000,
        token_type: 'Bearer',
      };

      vi.mocked(FileTokenStorage).mockImplementation(() => ({
        save: vi.fn().mockResolvedValue(undefined),
        load: vi.fn().mockReturnValue(storedTokenData),
        clear: vi.fn().mockResolvedValue(undefined),
      }));

      const newTokenManager = new OAuth2TokenManager(
        'qbo',
        'test-refresh-token',
      );

      expect(newTokenManager.isTokenValid()).toBe(true);
      expect(newTokenManager.getCurrentRefreshToken()).toBe(
        'stored-refresh-token',
      );
    });

    it('should handle storage load errors gracefully', async () => {
      const { FileTokenStorage } = await import('./FileTokenStorage');

      vi.mocked(FileTokenStorage).mockImplementation(() => ({
        save: vi.fn().mockResolvedValue(undefined),
        load: vi.fn().mockImplementation(() => {
          throw new Error('Storage read error');
        }),
        clear: vi.fn().mockResolvedValue(undefined),
      }));

      // Should not throw error
      const newTokenManager = new OAuth2TokenManager(
        'qbo',
        'test-refresh-token',
      );

      expect(newTokenManager.getCurrentRefreshToken()).toBe(
        'test-refresh-token',
      );
      expect(newTokenManager.isTokenValid()).toBe(false);
    });

    it('should handle storage save errors gracefully', async () => {
      const { FileTokenStorage } = await import('./FileTokenStorage');

      vi.mocked(FileTokenStorage).mockImplementation(() => ({
        save: vi.fn().mockRejectedValue(new Error('Storage write error')),
        load: vi.fn().mockReturnValue(null),
        clear: vi.fn().mockResolvedValue(undefined),
      }));

      const expiredTokenData: TokenData = {
        access_token: 'expired-access-token',
        refresh_token: 'refresh-token',
        expires_at: Date.now() - 3600000,
        token_type: 'Bearer',
      };

      const setTokenData = (
        tokenManager as unknown as { setTokenData: (data: TokenData) => void }
      ).setTokenData.bind(tokenManager);

      setTokenData(expiredTokenData);

      // Should still return access token even if save fails
      const accessToken = await tokenManager.getAccessToken();

      expect(accessToken).toBe('new-access-token');
    });

    it('should handle storage clear errors gracefully', async () => {
      const { OAuth2TokenRefreshProvider } = await import(
        './OAuth2TokenRefreshProvider'
      );
      const { FileTokenStorage } = await import('./FileTokenStorage');

      vi.mocked(OAuth2TokenRefreshProvider).mockImplementation(() => ({
        refreshToken: vi
          .fn()
          .mockRejectedValue(new Error('invalid or expired refresh token')),
      }));

      vi.mocked(FileTokenStorage).mockImplementation(() => ({
        save: vi.fn().mockResolvedValue(undefined),
        load: vi.fn().mockReturnValue(null),
        clear: vi.fn().mockRejectedValue(new Error('Storage clear error')),
      }));

      const expiredTokenData: TokenData = {
        access_token: 'expired-access-token',
        refresh_token: 'refresh-token',
        expires_at: Date.now() - 3600000,
        token_type: 'Bearer',
      };

      const setTokenData = (
        tokenManager as unknown as { setTokenData: (data: TokenData) => void }
      ).setTokenData.bind(tokenManager);

      setTokenData(expiredTokenData);

      // Should still throw the original error even if clear fails
      await expect(tokenManager.getAccessToken()).rejects.toThrow(
        'invalid or expired refresh token',
      );
    });
  });

  describe('edge cases and malformed data', () => {
    it('should handle malformed token data from storage', async () => {
      const { FileTokenStorage } = await import('./FileTokenStorage');

      vi.mocked(FileTokenStorage).mockImplementation(() => ({
        save: vi.fn().mockResolvedValue(undefined),
        load: vi.fn().mockReturnValue({
          access_token: null, // Invalid: should be string
          refresh_token: 'refresh-token',
          expires_at: 'invalid-date', // Invalid: should be number
          token_type: 'Bearer',
        } as any),
        clear: vi.fn().mockResolvedValue(undefined),
      }));

      // Should not throw error, should fall back to default refresh token
      const newTokenManager = new OAuth2TokenManager(
        'qbo',
        'test-refresh-token',
      );

      expect(newTokenManager.getCurrentRefreshToken()).toBe(
        'test-refresh-token',
      );
      expect(newTokenManager.isTokenValid()).toBe(false);
    });

    it('should handle missing token fields from storage', async () => {
      const { FileTokenStorage } = await import('./FileTokenStorage');

      vi.mocked(FileTokenStorage).mockImplementation(() => ({
        save: vi.fn().mockResolvedValue(undefined),
        load: vi.fn().mockReturnValue({
          access_token: 'stored-access-token',
          // Missing refresh_token and expires_at
          token_type: 'Bearer',
        } as any),
        clear: vi.fn().mockResolvedValue(undefined),
      }));

      const newTokenManager = new OAuth2TokenManager(
        'qbo',
        'test-refresh-token',
      );

      expect(newTokenManager.getCurrentRefreshToken()).toBe(
        'test-refresh-token',
      );
      expect(newTokenManager.isTokenValid()).toBe(false);
    });

    it('should handle empty string access token', async () => {
      const tokenData: TokenData = {
        access_token: '', // Empty string
        refresh_token: 'refresh-token',
        expires_at: Date.now() + 3600000,
        token_type: 'Bearer',
      };

      const setTokenData = (
        tokenManager as unknown as { setTokenData: (data: TokenData) => void }
      ).setTokenData.bind(tokenManager);

      setTokenData(tokenData);

      expect(tokenManager.isTokenValid()).toBe(false);
    });

    it('should handle null access token', async () => {
      const tokenData: TokenData = {
        access_token: null as any, // Null access token
        refresh_token: 'refresh-token',
        expires_at: Date.now() + 3600000,
        token_type: 'Bearer',
      };

      const setTokenData = (
        tokenManager as unknown as { setTokenData: (data: TokenData) => void }
      ).setTokenData.bind(tokenManager);

      setTokenData(tokenData);

      expect(tokenManager.isTokenValid()).toBe(false);
    });

    it('should handle invalid expiry date', async () => {
      const tokenData: TokenData = {
        access_token: 'valid-access-token',
        refresh_token: 'refresh-token',
        expires_at: NaN, // Invalid expiry
        token_type: 'Bearer',
      };

      const setTokenData = (
        tokenManager as unknown as { setTokenData: (data: TokenData) => void }
      ).setTokenData.bind(tokenManager);

      setTokenData(tokenData);

      expect(tokenManager.isTokenValid()).toBe(false);
    });

    it('should handle refresh buffer logic correctly', async () => {
      const { OAuth2TokenRefreshProvider } = await import(
        './OAuth2TokenRefreshProvider'
      );

      // Token expires in 3 minutes (within 5-minute buffer)
      const tokenData: TokenData = {
        access_token: 'valid-access-token',
        refresh_token: 'refresh-token',
        expires_at: Date.now() + 3 * 60 * 1000,
        token_type: 'Bearer',
      };

      const setTokenData = (
        tokenManager as unknown as { setTokenData: (data: TokenData) => void }
      ).setTokenData.bind(tokenManager);

      setTokenData(tokenData);

      // Should not trigger refresh since token is within buffer
      const accessToken = await tokenManager.getAccessToken();

      expect(accessToken).toBe('valid-access-token');

      // Verify refresh was not called
      const mockRefreshProvider = vi.mocked(OAuth2TokenRefreshProvider);

      expect(mockRefreshProvider).not.toHaveBeenCalled();
    });
  });
});
