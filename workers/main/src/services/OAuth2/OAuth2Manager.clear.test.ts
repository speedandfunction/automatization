import { AccessToken, AuthorizationCode } from 'simple-oauth2';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

describe('OAuth2Manager ClearTokens', () => {
  let oauth2Manager: OAuth2Manager;
  let mockStorage: FileTokenStorage;
  let mockOAuth2Client: AuthorizationCode;
  let mockAccessToken: AccessToken;
  let mockRevokeAll: ReturnType<typeof vi.fn>;
  let mockExpired: ReturnType<typeof vi.fn>;
  let mockLoad: ReturnType<typeof vi.fn>;
  let mockClear: ReturnType<typeof vi.fn>;
  let mockCreateToken: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRevokeAll = vi.fn();
    mockExpired = vi.fn();
    mockLoad = vi.fn();
    mockClear = vi.fn();
    mockCreateToken = vi.fn();

    mockAccessToken = {
      token: mockTokenDataWithDate,
      revokeAll: mockRevokeAll,
      expired: mockExpired,
    } as unknown as AccessToken;

    mockStorage = {
      save: vi.fn(),
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

  it('should clear tokens successfully', async () => {
    mockLoad.mockResolvedValue(mockTokenData);

    await oauth2Manager.getAccessToken();
    await oauth2Manager.clearTokens();

    expect(mockRevokeAll).toHaveBeenCalled();
    expect(mockClear).toHaveBeenCalled();
  });

  it('should handle revoke failure gracefully', async () => {
    mockLoad.mockResolvedValue(mockTokenData);
    mockRevokeAll.mockRejectedValue(new Error('Revoke failed'));

    await oauth2Manager.getAccessToken();
    await oauth2Manager.clearTokens();

    expect(mockRevokeAll).toHaveBeenCalled();
    expect(mockClear).toHaveBeenCalled();
  });

  it('should clear tokens even when no access token exists', async () => {
    await oauth2Manager.clearTokens();

    expect(mockClear).toHaveBeenCalled();
  });

  it('should handle revoke error with non-Error object', async () => {
    mockLoad.mockResolvedValue(mockTokenData);
    mockRevokeAll.mockRejectedValue('String error');

    await oauth2Manager.getAccessToken();
    await oauth2Manager.clearTokens();

    expect(mockRevokeAll).toHaveBeenCalled();
    expect(mockClear).toHaveBeenCalled();
  });
});
