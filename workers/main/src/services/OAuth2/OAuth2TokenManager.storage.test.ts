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

describe('OAuth2TokenManager - Storage & Edge Cases', () => {
  let tokenManager: OAuth2TokenManager;

  beforeEach(async () => {
    tokenManager = new OAuth2TokenManager('qbo', 'test-refresh-token');
    // Wait for async initialization to complete
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should load tokens from storage on initialization', () => {
    expect(tokenManager).toBeInstanceOf(OAuth2TokenManager);
    expect(tokenManager.isTokenValid()).toBe(false);
  });

  it('should handle empty string access token', () => {
    const tokenData: TokenData = {
      access_token: '',
      refresh_token: 'refresh-token',
      expires_at: Date.now() + 3600000,
      token_type: 'Bearer',
    };

    tokenManager.setTokenDataForTesting(tokenData);
    expect(tokenManager.isTokenValid()).toBe(false);
  });

  it('should handle null access token', () => {
    const tokenData: TokenData = {
      access_token: null as unknown as string,
      refresh_token: 'refresh-token',
      expires_at: Date.now() + 3600000,
      token_type: 'Bearer',
    };

    tokenManager.setTokenDataForTesting(tokenData);
    expect(tokenManager.isTokenValid()).toBe(false);
  });

  it('should handle invalid expiry date', () => {
    const tokenData: TokenData = {
      access_token: 'valid-token',
      refresh_token: 'refresh-token',
      expires_at: NaN,
      token_type: 'Bearer',
    };

    tokenManager.setTokenDataForTesting(tokenData);
    expect(tokenManager.isTokenValid()).toBe(false);
  });

  it('should handle expired token', () => {
    const tokenData: TokenData = {
      access_token: 'expired-token',
      refresh_token: 'refresh-token',
      expires_at: Date.now() - 3600000,
      token_type: 'Bearer',
    };

    tokenManager.setTokenDataForTesting(tokenData);
    expect(tokenManager.isTokenValid()).toBe(false);
  });

  it('should handle valid token', () => {
    const tokenData: TokenData = {
      access_token: 'valid-token',
      refresh_token: 'refresh-token',
      expires_at: Date.now() + 3600000,
      token_type: 'Bearer',
    };

    tokenManager.setTokenDataForTesting(tokenData);
    expect(tokenManager.isTokenValid()).toBe(true);
  });

  it('should return default refresh token when no cached token', () => {
    expect(tokenManager.getCurrentRefreshToken()).toBe('test-refresh-token');
  });
});
