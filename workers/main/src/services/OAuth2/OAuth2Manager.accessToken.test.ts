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

describe('OAuth2Manager GetAccessToken', () => {
  let oauth2Manager: OAuth2Manager;
  let mockStorage: FileTokenStorage;
  let mockOAuth2Client: AuthorizationCode;
  let mockAccessToken: AccessToken;
  let mockRefreshToken: ReturnType<typeof vi.fn>;
  let mockExpired: ReturnType<typeof vi.fn>;
  let mockLoad: ReturnType<typeof vi.fn>;
  let mockSave: ReturnType<typeof vi.fn>;
  let mockCreateToken: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRefreshToken = vi.fn();
    mockExpired = vi.fn();
    mockLoad = vi.fn();
    mockSave = vi.fn();
    mockCreateToken = vi.fn();

    mockAccessToken = {
      token: mockTokenDataWithDate,
      refresh: mockRefreshToken,
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

  it('should return access token when token is valid and not expired', async () => {
    mockExpired.mockReturnValue(false);
    mockLoad.mockResolvedValue(mockTokenData);

    const result = await oauth2Manager.getAccessToken();

    expect(result).toBe(mockTokenData.access_token);
    expect(mockLoad).toHaveBeenCalled();
    expect(mockCreateToken).toHaveBeenCalledWith({
      access_token: mockTokenData.access_token,
      refresh_token: mockTokenData.refresh_token,
      expires_at: new Date(mockTokenData.expires_at),
      token_type: mockTokenData.token_type,
    });
  });

  it('should refresh token when token is expired', async () => {
    mockExpired.mockReturnValue(true);
    mockRefreshToken.mockResolvedValue(mockAccessToken);
    mockLoad.mockResolvedValue(mockTokenData);

    const result = await oauth2Manager.getAccessToken();

    expect(result).toBe(mockTokenData.access_token);
    expect(mockRefreshToken).toHaveBeenCalled();
    expect(mockSave).toHaveBeenCalled();
  });

  it('should throw OAuth2Error when no token is available', async () => {
    mockLoad.mockResolvedValue(null);

    await expect(oauth2Manager.getAccessToken()).rejects.toThrow(OAuth2Error);
    await expect(oauth2Manager.getAccessToken()).rejects.toThrow(
      'No access token available',
    );
  });

  it('should throw OAuth2Error when token has invalid format', async () => {
    const invalidTokenData = {
      ...mockTokenDataWithDate,
      access_token: null,
    };

    const invalidAccessToken = {
      token: invalidTokenData,
      expired: mockExpired,
    } as unknown as AccessToken;

    mockExpired.mockReturnValue(false);
    mockLoad.mockResolvedValue(mockTokenData);
    mockCreateToken.mockReturnValue(invalidAccessToken);

    await expect(oauth2Manager.getAccessToken()).rejects.toThrow(OAuth2Error);
    await expect(oauth2Manager.getAccessToken()).rejects.toThrow(
      'Invalid access token format',
    );
  });

  it('should handle concurrent refresh requests', async () => {
    mockExpired.mockReturnValue(true);
    mockRefreshToken.mockResolvedValue(mockAccessToken);
    mockLoad.mockResolvedValue(mockTokenData);

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
