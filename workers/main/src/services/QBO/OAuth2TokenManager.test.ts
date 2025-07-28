import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { qboConfig } from '../../configs/qbo';
import { OAuth2TokenManager, TokenData } from './OAuth2TokenManager';

// Mock axios
vi.mock('axios');
const mockAxios = vi.mocked(axios);

// Mock file system
vi.mock('fs/promises');
const mockFs = vi.mocked(fs);

// Mock qboConfig
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
  const mockTokenResponse = {
    data: {
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
      expires_in: 3600,
      token_type: 'Bearer',
    },
  };

  beforeEach(() => {
    tokenManager = new OAuth2TokenManager();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct token file path', () => {
      expect(tokenManager).toBeInstanceOf(OAuth2TokenManager);
    });
  });

  describe('getAccessToken', () => {
    it('should return cached token if not expired', async () => {
      // Mock successful token response
      mockAxios.post.mockResolvedValue(mockTokenResponse);

      // Mock file read to return valid cached token
      const cachedTokenData: TokenData = {
        access_token: 'cached-access-token',
        refresh_token: 'cached-refresh-token',
        expires_at: Date.now() + 3600000, // 1 hour from now
        token_type: 'Bearer',
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(cachedTokenData));

      const token = await tokenManager.getAccessToken();

      expect(token).toBe('cached-access-token');
      expect(mockAxios.post).not.toHaveBeenCalled(); // Should not refresh
    });

    it('should refresh token if cached token is expired', async () => {
      // Mock successful token response
      mockAxios.post.mockResolvedValue(mockTokenResponse);

      // Mock file read to return expired cached token
      const expiredTokenData: TokenData = {
        access_token: 'expired-access-token',
        refresh_token: 'expired-refresh-token',
        expires_at: Date.now() - 3600000, // 1 hour ago
        token_type: 'Bearer',
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(expiredTokenData));

      const token = await tokenManager.getAccessToken();

      expect(token).toBe('new-access-token');
      expect(mockAxios.post).toHaveBeenCalledWith(
        'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
        'grant_type=refresh_token&refresh_token=expired-refresh-token',
        expect.objectContaining({
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization':
              'Basic dGVzdC1jbGllbnQtaWQ6dGVzdC1jbGllbnQtc2VjcmV0',
          },
        }),
      );
    });

    it('should use config refresh token if no cached token exists', async () => {
      // Mock successful token response
      mockAxios.post.mockResolvedValue(mockTokenResponse);

      // Mock file read to throw error (no cached token)
      mockFs.readFile.mockRejectedValue(new Error('File not found'));

      const token = await tokenManager.getAccessToken();

      expect(token).toBe('new-access-token');
      expect(mockAxios.post).toHaveBeenCalledWith(
        'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
        'grant_type=refresh_token&refresh_token=test-refresh-token',
        expect.any(Object),
      );
    });

    it('should throw error if token refresh fails', async () => {
      // Mock failed token response
      mockAxios.post.mockRejectedValue(new Error('Token refresh failed'));

      // Mock file read to throw error (no cached token)
      mockFs.readFile.mockRejectedValue(new Error('File not found'));

      await expect(tokenManager.getAccessToken()).rejects.toThrow(
        'Failed to obtain access token',
      );
    });
  });

  describe('getCurrentRefreshToken', () => {
    it('should return cached refresh token if available', async () => {
      const cachedTokenData: TokenData = {
        access_token: 'cached-access-token',
        refresh_token: 'cached-refresh-token',
        expires_at: Date.now() + 3600000,
        token_type: 'Bearer',
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(cachedTokenData));

      const refreshToken = await tokenManager.getCurrentRefreshToken();

      expect(refreshToken).toBe('cached-refresh-token');
    });

    it('should return config refresh token if no cached token', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'));

      const refreshToken = await tokenManager.getCurrentRefreshToken();

      expect(refreshToken).toBe('test-refresh-token');
    });
  });

  describe('updateRefreshTokenInConfig', () => {
    it('should update refresh token and save to file', async () => {
      const newRefreshToken = 'updated-refresh-token';

      await tokenManager.updateRefreshTokenInConfig(newRefreshToken);

      // Verify that the token was saved to file
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('qbo_tokens.json'),
        expect.stringContaining(newRefreshToken),
        'utf-8',
      );
    });
  });

  describe('token refresh with new refresh token', () => {
    it('should handle new refresh token from QBO response', async () => {
      // Mock response with new refresh token
      const responseWithNewToken = {
        data: {
          access_token: 'new-access-token',
          refresh_token: 'brand-new-refresh-token', // Different from config
          expires_in: 3600,
          token_type: 'Bearer',
        },
      };

      mockAxios.post.mockResolvedValue(responseWithNewToken);
      mockFs.readFile.mockRejectedValue(new Error('File not found'));

      const token = await tokenManager.getAccessToken();

      expect(token).toBe('new-access-token');

      // Verify that new tokens were saved
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('qbo_tokens.json'),
        expect.stringContaining('brand-new-refresh-token'),
        'utf-8',
      );
    });
  });
});
