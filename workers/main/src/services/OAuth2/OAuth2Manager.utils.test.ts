import { AccessToken, AuthorizationCode } from 'simple-oauth2';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OAuth2Error } from '../../common/errors';
import { FileTokenStorage } from './FileTokenStorage';
import { OAuth2Manager } from './OAuth2Manager';
import { OAuth2Config, TokenData } from './types';

vi.mock('./FileTokenStorage');
vi.mock('simple-oauth2');

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

describe('OAuth2Manager Utils', () => {
  let oauth2Manager: OAuth2Manager;
  let mockStorage: FileTokenStorage;
  let mockOAuth2Client: AuthorizationCode;
  let mockAccessToken: AccessToken;
  let mockExpired: ReturnType<typeof vi.fn>;
  let mockLoad: ReturnType<typeof vi.fn>;
  let mockSave: ReturnType<typeof vi.fn>;
  let mockCreateToken: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockExpired = vi.fn();
    mockLoad = vi.fn();
    mockSave = vi.fn();
    mockCreateToken = vi.fn();

    mockAccessToken = {
      token: mockTokenDataWithDate,
      expired: mockExpired,
    } as unknown as AccessToken;

    mockStorage = {
      save: mockSave,
      load: mockLoad,
      clear: vi.fn(),
    } as unknown as FileTokenStorage;

    mockOAuth2Client = {
      createToken: mockCreateToken.mockReturnValue(mockAccessToken),
    } as unknown as AuthorizationCode;

    vi.mocked(FileTokenStorage).mockImplementation(() => mockStorage);
    vi.mocked(AuthorizationCode).mockImplementation(() => mockOAuth2Client);

    oauth2Manager = new OAuth2Manager('test-service', mockOAuth2Config);
  });

  describe('ensureTokenLoaded', () => {
    it('should load token from storage when not already loaded', async () => {
      mockLoad.mockResolvedValue(mockTokenData);

      await oauth2Manager.getAccessToken();

      expect(mockLoad).toHaveBeenCalled();
      expect(mockCreateToken).toHaveBeenCalledWith({
        access_token: mockTokenData.access_token,
        refresh_token: mockTokenData.refresh_token,
        expires_at: new Date(mockTokenData.expires_at),
        token_type: mockTokenData.token_type,
      });
    });

    it('should not reload token when already loaded', async () => {
      mockLoad.mockResolvedValue(mockTokenData);
      mockExpired.mockReturnValue(false);

      await oauth2Manager.getAccessToken();
      await oauth2Manager.getAccessToken();

      expect(mockLoad).toHaveBeenCalledTimes(1);
    });
  });

  describe('saveToken', () => {
    let mockRefreshToken: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mockRefreshToken = vi.fn();
      mockAccessToken = {
        token: mockTokenDataWithDate,
        refresh: mockRefreshToken,
        expired: mockExpired,
      } as unknown as AccessToken;
      mockCreateToken.mockReturnValue(mockAccessToken);
    });

    it('should save token with correct data structure', async () => {
      mockLoad.mockResolvedValue(mockTokenData);
      mockExpired.mockReturnValue(true);
      mockRefreshToken.mockResolvedValue(mockAccessToken);

      await oauth2Manager.getAccessToken();

      expect(mockSave).toHaveBeenCalledWith({
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
        expired: mockExpired,
      } as unknown as AccessToken;

      mockRefreshToken.mockResolvedValue(incompleteAccessToken);
      mockLoad.mockResolvedValue(mockTokenData);
      mockExpired.mockReturnValue(true);

      await oauth2Manager.getAccessToken();

      expect(mockSave).toHaveBeenCalledWith({
        access_token: 'test-access-token',
        refresh_token: mockOAuth2Config.refreshToken,
        expires_at: expect.any(Number) as number,
        token_type: 'Bearer',
      });
    });

    it('should handle null token data', async () => {
      const nullAccessToken = {
        token: null,
        refresh: mockRefreshToken,
        expired: mockExpired,
      } as unknown as AccessToken;

      mockRefreshToken.mockResolvedValue(nullAccessToken);
      mockLoad.mockResolvedValue(mockTokenData);
      mockExpired.mockReturnValue(true);

      await expect(oauth2Manager.getAccessToken()).rejects.toThrow(OAuth2Error);
      await expect(oauth2Manager.getAccessToken()).rejects.toThrow(
        'Invalid token data',
      );
    });
  });
});
