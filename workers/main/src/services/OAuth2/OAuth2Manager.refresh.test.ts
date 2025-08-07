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

describe('OAuth2Manager RefreshToken', () => {
  let oauth2Manager: OAuth2Manager;
  let mockStorage: FileTokenStorage;
  let mockOAuth2Client: AuthorizationCode;
  let mockAccessToken: AccessToken;
  let mockRefreshToken: ReturnType<typeof vi.fn>;
  let mockExpired: ReturnType<typeof vi.fn>;
  let mockLoad: ReturnType<typeof vi.fn>;
  let mockSave: ReturnType<typeof vi.fn>;
  let mockClear: ReturnType<typeof vi.fn>;
  let mockCreateToken: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRefreshToken = vi.fn();
    mockExpired = vi.fn();
    mockLoad = vi.fn();
    mockSave = vi.fn();
    mockClear = vi.fn();
    mockCreateToken = vi.fn();

    mockAccessToken = {
      token: mockTokenDataWithDate,
      refresh: mockRefreshToken,
      expired: mockExpired,
    } as unknown as AccessToken;

    mockStorage = {
      save: mockSave,
      load: mockLoad,
      clear: mockClear,
    } as unknown as FileTokenStorage;

    mockOAuth2Client = {
      createToken: mockCreateToken.mockReturnValue(mockAccessToken),
    } as unknown as AuthorizationCode;

    vi.mocked(FileTokenStorage).mockImplementation(() => mockStorage);
    vi.mocked(AuthorizationCode).mockImplementation(() => mockOAuth2Client);

    oauth2Manager = new OAuth2Manager('test-service', mockOAuth2Config);
  });

  it('should refresh token successfully', async () => {
    mockRefreshToken.mockResolvedValue(mockAccessToken);
    mockLoad.mockResolvedValue(mockTokenData);

    await oauth2Manager.getAccessToken();
    await oauth2Manager.refreshToken();

    expect(mockRefreshToken).toHaveBeenCalled();
    expect(mockSave).toHaveBeenCalled();
  });

  it('should handle concurrent refresh requests', async () => {
    mockRefreshToken.mockResolvedValue(mockAccessToken);
    mockLoad.mockResolvedValue(mockTokenData);

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
    mockLoad.mockResolvedValue(mockTokenData);
    mockRefreshToken.mockRejectedValue(new Error('invalid_grant'));
    mockExpired.mockReturnValue(false);

    await oauth2Manager.getAccessToken();

    await expect(oauth2Manager.refreshToken()).rejects.toThrow(
      'Invalid refresh token - tokens cleared',
    );

    expect(mockClear).toHaveBeenCalled();
  });

  it('should throw OAuth2Error for other refresh failures', async () => {
    mockLoad.mockResolvedValue(mockTokenData);
    mockRefreshToken.mockRejectedValue(new Error('Network error'));

    await oauth2Manager.getAccessToken();

    await expect(oauth2Manager.refreshToken()).rejects.toThrow(OAuth2Error);
    await expect(oauth2Manager.refreshToken()).rejects.toThrow(
      'Failed to refresh token: Network error',
    );
  });

  it('should handle refresh error with non-Error object', async () => {
    mockLoad.mockResolvedValue(mockTokenData);
    mockRefreshToken.mockRejectedValue('String error');

    await oauth2Manager.getAccessToken();

    await expect(oauth2Manager.refreshToken()).rejects.toThrow(OAuth2Error);
    await expect(oauth2Manager.refreshToken()).rejects.toThrow(
      'Failed to refresh token: String error',
    );
  });
});
