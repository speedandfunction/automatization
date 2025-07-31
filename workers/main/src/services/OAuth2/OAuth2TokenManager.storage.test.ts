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

describe('OAuth2TokenManager - Storage & Edge Cases', () => {
  let tokenManager: OAuth2TokenManager;

  beforeEach(() => {
    tokenManager = new OAuth2TokenManager('qbo', 'test-refresh-token');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should load tokens from storage on initialization', async () => {
    const { FileTokenStorage } = await import('./FileTokenStorage');
    const storedTokenData: TokenData = {
      access_token: 'stored-access-token',
      refresh_token: 'stored-refresh-token',
      expires_at: Date.now() + 3600000,
      token_type: 'Bearer',
    };

    // @ts-expect-error - Mock only needs to implement used methods
    vi.mocked(FileTokenStorage).mockImplementation(() => ({
      save: vi.fn().mockResolvedValue(undefined),
      load: vi.fn().mockReturnValue(storedTokenData),
      clear: vi.fn().mockResolvedValue(undefined),
    }));

    const newTokenManager = new OAuth2TokenManager('qbo', 'test-refresh-token');

    expect(newTokenManager.isTokenValid()).toBe(true);
    expect(newTokenManager.getCurrentRefreshToken()).toBe(
      'stored-refresh-token',
    );
  });

  it('should handle storage load errors gracefully', async () => {
    const { FileTokenStorage } = await import('./FileTokenStorage');

    // @ts-expect-error - Mock only needs to implement used methods
    vi.mocked(FileTokenStorage).mockImplementation(() => ({
      save: vi.fn().mockResolvedValue(undefined),
      load: vi.fn().mockImplementation(() => {
        throw new Error('Storage read error');
      }),
      clear: vi.fn().mockResolvedValue(undefined),
    }));

    const newTokenManager = new OAuth2TokenManager('qbo', 'test-refresh-token');

    expect(newTokenManager.getCurrentRefreshToken()).toBe('test-refresh-token');
    expect(newTokenManager.isTokenValid()).toBe(false);
  });

  it('should handle malformed token data from storage', async () => {
    const { FileTokenStorage } = await import('./FileTokenStorage');

    // @ts-expect-error - Mock only needs to implement used methods
    vi.mocked(FileTokenStorage).mockImplementation(() => ({
      save: vi.fn().mockResolvedValue(undefined),
      load: vi.fn().mockReturnValue({
        access_token: null,
        refresh_token: 'refresh-token',
        expires_at: 'invalid-date',
        token_type: 'Bearer',
      } as unknown as TokenData),
      clear: vi.fn().mockResolvedValue(undefined),
    }));

    const newTokenManager = new OAuth2TokenManager('qbo', 'test-refresh-token');

    expect(newTokenManager.getCurrentRefreshToken()).toBe('test-refresh-token');
    expect(newTokenManager.isTokenValid()).toBe(false);
  });

  it('should handle missing token fields from storage', async () => {
    const { FileTokenStorage } = await import('./FileTokenStorage');

    // @ts-expect-error - Mock only needs to implement used methods
    vi.mocked(FileTokenStorage).mockImplementation(() => ({
      save: vi.fn().mockResolvedValue(undefined),
      load: vi.fn().mockReturnValue({
        access_token: 'stored-access-token',
        token_type: 'Bearer',
      } as unknown as TokenData),
      clear: vi.fn().mockResolvedValue(undefined),
    }));

    const newTokenManager = new OAuth2TokenManager('qbo', 'test-refresh-token');

    expect(newTokenManager.getCurrentRefreshToken()).toBe('test-refresh-token');
    expect(newTokenManager.isTokenValid()).toBe(false);
  });

  it('should handle empty string access token', async () => {
    const tokenData: TokenData = {
      access_token: '',
      refresh_token: 'refresh-token',
      expires_at: Date.now() + 3600000,
      token_type: 'Bearer',
    };

    tokenManager.setTokenDataForTesting(tokenData);

    expect(tokenManager.isTokenValid()).toBe(false);
  });

  it('should handle null access token', async () => {
    const tokenData: TokenData = {
      access_token: null as unknown as string,
      refresh_token: 'refresh-token',
      expires_at: Date.now() + 3600000,
      token_type: 'Bearer',
    };

    tokenManager.setTokenDataForTesting(tokenData);

    expect(tokenManager.isTokenValid()).toBe(false);
  });

  it('should handle invalid expiry date', async () => {
    const tokenData: TokenData = {
      access_token: 'valid-access-token',
      refresh_token: 'refresh-token',
      expires_at: NaN,
      token_type: 'Bearer',
    };

    tokenManager.setTokenDataForTesting(tokenData);

    expect(tokenManager.isTokenValid()).toBe(false);
  });
});
