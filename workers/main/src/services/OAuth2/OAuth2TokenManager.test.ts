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
  });
});
