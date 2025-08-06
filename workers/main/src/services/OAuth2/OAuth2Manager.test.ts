import { AccessToken, AuthorizationCode } from 'simple-oauth2';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OAuth2Error } from '../../common/errors';
import { FileTokenStorage } from './FileTokenStorage';
import { OAuth2Manager } from './OAuth2Manager';
import { OAuth2Config, TokenData } from './types';

vi.mock('./FileTokenStorage');
vi.mock('simple-oauth2');

describe('OAuth2Manager', () => {
  let oauth2Manager: OAuth2Manager;
  let mockStorage: FileTokenStorage;
  let mockOAuth2Client: AuthorizationCode;
  let mockAccessToken: AccessToken;
  let mockRefreshToken: ReturnType<typeof vi.fn>;
  let mockRevokeAll: ReturnType<typeof vi.fn>;
  let mockExpired: ReturnType<typeof vi.fn>;

  const mockOAuth2Config: OAuth2Config = {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    refreshToken: 'test-refresh-token',
    tokenHost: 'https://oauth.example.com',
    tokenPath: '/oauth/token',
    tokenExpirationWindowSeconds: 300,
  };

  const mockTokenData: TokenData = {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    expires_at: Date.now() + 3600000,
    token_type: 'Bearer',
  };

  const mockTokenDataWithDate = {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    expires_at: new Date(Date.now() + 3600000),
    token_type: 'Bearer',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockRefreshToken = vi.fn();
    mockRevokeAll = vi.fn();
    mockExpired = vi.fn();

    mockAccessToken = {
      token: mockTokenDataWithDate,
      refresh: mockRefreshToken,
      revokeAll: mockRevokeAll,
      expired: mockExpired,
    } as unknown as AccessToken;

    mockStorage = {
      save: vi.fn(),
      load: vi.fn(),
      clear: vi.fn(),
    } as unknown as FileTokenStorage;

    mockOAuth2Client = {
      createToken: vi.fn().mockReturnValue(mockAccessToken),
    } as unknown as AuthorizationCode;

    vi.mocked(FileTokenStorage).mockImplementation(() => mockStorage);
    vi.mocked(AuthorizationCode).mockImplementation(() => mockOAuth2Client);

    oauth2Manager = new OAuth2Manager('test-service', mockOAuth2Config);
  });

  describe('constructor', () => {
    it('should create OAuth2Manager with correct configuration', () => {
      expect(oauth2Manager).toBeInstanceOf(OAuth2Manager);
      expect(AuthorizationCode).toHaveBeenCalledWith({
        client: {
          id: mockOAuth2Config.clientId,
          secret: mockOAuth2Config.clientSecret,
        },
        auth: {
          tokenHost: mockOAuth2Config.tokenHost,
          tokenPath: mockOAuth2Config.tokenPath,
        },
        http: {
          json: 'strict',
          headers: {
            'User-Agent': 'TemporalWorker/1.0',
          },
        },
      });
    });

    it('should create FileTokenStorage with service name', () => {
      expect(FileTokenStorage).toHaveBeenCalledWith(
        'test-service',
        mockOAuth2Client,
      );
    });
  });

  describe('getAccessToken', () => {
    it('should return access token when token is valid and not expired', async () => {
      mockExpired.mockReturnValue(false);
      vi.mocked(mockStorage.load).mockResolvedValue(mockTokenData);

      const result = await oauth2Manager.getAccessToken();

      expect(result).toBe(mockTokenData.access_token);
      expect(mockStorage.load).toHaveBeenCalled();
      expect(mockOAuth2Client.createToken).toHaveBeenCalledWith({
        access_token: mockTokenData.access_token,
        refresh_token: mockTokenData.refresh_token,
        expires_at: new Date(mockTokenData.expires_at),
        token_type: mockTokenData.token_type,
      });
    });

    it('should refresh token when token is expired', async () => {
      mockExpired.mockReturnValue(true);
      mockRefreshToken.mockResolvedValue(mockAccessToken);
      vi.mocked(mockStorage.load).mockResolvedValue(mockTokenData);

      const result = await oauth2Manager.getAccessToken();

      expect(result).toBe(mockTokenData.access_token);
      expect(mockRefreshToken).toHaveBeenCalled();
      expect(mockStorage.save).toHaveBeenCalled();
    });

    it('should throw OAuth2Error when no token is available', async () => {
      vi.mocked(mockStorage.load).mockResolvedValue(null);

      await expect(oauth2Manager.getAccessToken()).rejects.toThrow(OAuth2Error);
      await expect(oauth2Manager.getAccessToken()).rejects.toThrow(
        'No access token available',
      );
    });

    it('should handle concurrent refresh requests', async () => {
      mockExpired.mockReturnValue(true);
      mockRefreshToken.mockResolvedValue(mockAccessToken);
      vi.mocked(mockStorage.load).mockResolvedValue(mockTokenData);

      const promises = [
        oauth2Manager.getAccessToken(),
        oauth2Manager.getAccessToken(),
        oauth2Manager.getAccessToken(),
      ];

      const results = await Promise.all(promises);

      expect(results).toEqual([
        mockTokenData.access_token,
        mockTokenData.access_token,
        mockTokenData.access_token,
      ]);
      expect(mockRefreshToken).toHaveBeenCalledTimes(1);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      mockRefreshToken.mockResolvedValue(mockAccessToken);
      vi.mocked(mockStorage.load).mockResolvedValue(mockTokenData);

      // First load the token
      await oauth2Manager.getAccessToken();

      await oauth2Manager.refreshToken();

      expect(mockRefreshToken).toHaveBeenCalled();
      expect(mockStorage.save).toHaveBeenCalled();
    });

    it('should handle concurrent refresh requests', async () => {
      mockRefreshToken.mockResolvedValue(mockAccessToken);
      vi.mocked(mockStorage.load).mockResolvedValue(mockTokenData);

      // First load the token
      await oauth2Manager.getAccessToken();

      const promises = [
        oauth2Manager.refreshToken(),
        oauth2Manager.refreshToken(),
        oauth2Manager.refreshToken(),
      ];

      await Promise.all(promises);

      expect(mockRefreshToken).toHaveBeenCalledTimes(1);
    });

    it('should throw OAuth2Error when no token to refresh', async () => {
      await expect(oauth2Manager.refreshToken()).rejects.toThrow(OAuth2Error);
      await expect(oauth2Manager.refreshToken()).rejects.toThrow(
        'No access token to refresh',
      );
    });

    it('should handle invalid_grant error by clearing tokens', async () => {
      vi.mocked(mockStorage.load).mockResolvedValue(mockTokenData);
      mockRefreshToken.mockRejectedValue(new Error('invalid_grant'));
      mockExpired.mockReturnValue(false); // Ensure token is not expired initially

      // Load token without triggering refresh
      await oauth2Manager.getAccessToken();

      // Now call refreshToken directly
      await expect(oauth2Manager.refreshToken()).rejects.toThrow(
        'Invalid refresh token - tokens cleared',
      );

      expect(mockStorage.clear).toHaveBeenCalled();
    });

    it('should throw OAuth2Error for other refresh failures', async () => {
      vi.mocked(mockStorage.load).mockResolvedValue(mockTokenData);
      mockRefreshToken.mockRejectedValue(new Error('Network error'));

      // First load the token
      await oauth2Manager.getAccessToken();

      await expect(oauth2Manager.refreshToken()).rejects.toThrow(OAuth2Error);
      await expect(oauth2Manager.refreshToken()).rejects.toThrow(
        'Failed to refresh token: Network error',
      );
    });
  });

  describe('clearTokens', () => {
    it('should clear tokens successfully', async () => {
      vi.mocked(mockStorage.load).mockResolvedValue(mockTokenData);

      // First load the token
      await oauth2Manager.getAccessToken();

      await oauth2Manager.clearTokens();

      expect(mockRevokeAll).toHaveBeenCalled();
      expect(mockStorage.clear).toHaveBeenCalled();
    });

    it('should handle revoke failure gracefully', async () => {
      vi.mocked(mockStorage.load).mockResolvedValue(mockTokenData);
      mockRevokeAll.mockRejectedValue(new Error('Revoke failed'));

      // First load the token
      await oauth2Manager.getAccessToken();

      await oauth2Manager.clearTokens();

      expect(mockRevokeAll).toHaveBeenCalled();
      expect(mockStorage.clear).toHaveBeenCalled();
    });

    it('should clear tokens even when no access token exists', async () => {
      await oauth2Manager.clearTokens();

      expect(mockStorage.clear).toHaveBeenCalled();
    });
  });

  describe('ensureTokenLoaded', () => {
    it('should load token from storage when not already loaded', async () => {
      vi.mocked(mockStorage.load).mockResolvedValue(mockTokenData);

      await oauth2Manager.getAccessToken();

      expect(mockStorage.load).toHaveBeenCalled();
      expect(mockOAuth2Client.createToken).toHaveBeenCalledWith({
        access_token: mockTokenData.access_token,
        refresh_token: mockTokenData.refresh_token,
        expires_at: new Date(mockTokenData.expires_at),
        token_type: mockTokenData.token_type,
      });
    });

    it('should not reload token when already loaded', async () => {
      vi.mocked(mockStorage.load).mockResolvedValue(mockTokenData);
      mockExpired.mockReturnValue(false);

      await oauth2Manager.getAccessToken();
      await oauth2Manager.getAccessToken();

      expect(mockStorage.load).toHaveBeenCalledTimes(1);
    });
  });

  describe('saveToken', () => {
    it('should save token with correct data structure', async () => {
      vi.mocked(mockStorage.load).mockResolvedValue(mockTokenData);
      mockExpired.mockReturnValue(true);
      mockRefreshToken.mockResolvedValue(mockAccessToken);

      await oauth2Manager.getAccessToken();

      expect(mockStorage.save).toHaveBeenCalledWith({
        access_token: mockTokenData.access_token,
        refresh_token: mockTokenData.refresh_token,
        expires_at: mockTokenData.expires_at,
        token_type: mockTokenData.token_type,
      });
    });

    it('should use fallback values when token properties are missing', async () => {
      const incompleteTokenData = {
        access_token: 'test-access-token',
        refresh_token: undefined,
        expires_at: undefined,
        token_type: undefined,
      };

      const incompleteAccessToken = {
        token: incompleteTokenData,
        refresh: mockRefreshToken,
        revokeAll: mockRevokeAll,
        expired: mockExpired,
      } as unknown as AccessToken;

      mockRefreshToken.mockResolvedValue(incompleteAccessToken);
      vi.mocked(mockStorage.load).mockResolvedValue(mockTokenData);
      mockExpired.mockReturnValue(true);

      await oauth2Manager.getAccessToken();

      expect(mockStorage.save).toHaveBeenCalledWith({
        access_token: 'test-access-token',
        refresh_token: mockOAuth2Config.refreshToken,
        expires_at: expect.any(Number),
        token_type: 'Bearer',
      });
    });
  });
});
