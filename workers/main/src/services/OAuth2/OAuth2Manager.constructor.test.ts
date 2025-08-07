import { AuthorizationCode } from 'simple-oauth2';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FileTokenStorage } from './FileTokenStorage';
import { OAuth2Manager } from './OAuth2Manager';
import { OAuth2Config } from './types';

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

describe('OAuth2Manager Constructor', () => {
  let mockStorage: FileTokenStorage;
  let mockOAuth2Client: AuthorizationCode;

  beforeEach(() => {
    vi.clearAllMocks();

    mockStorage = {
      save: vi.fn(),
      load: vi.fn(),
      clear: vi.fn(),
    } as unknown as FileTokenStorage;

    mockOAuth2Client = {
      createToken: vi.fn(),
    } as unknown as AuthorizationCode;

    vi.mocked(FileTokenStorage).mockImplementation(() => mockStorage);
    vi.mocked(AuthorizationCode).mockImplementation(() => mockOAuth2Client);
  });

  it('should create OAuth2Manager with correct configuration', () => {
    const oauth2Manager = new OAuth2Manager('test-service', mockOAuth2Config);

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
    new OAuth2Manager('test-service', mockOAuth2Config);

    expect(FileTokenStorage).toHaveBeenCalledWith(
      'test-service',
      mockOAuth2Client,
    );
  });
});
