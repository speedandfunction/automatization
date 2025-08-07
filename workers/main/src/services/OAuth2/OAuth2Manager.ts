import { AccessToken, AuthorizationCode } from 'simple-oauth2';

import { OAuth2Error } from '../../common/errors';
import { FileTokenStorage } from './FileTokenStorage';
import { OAuth2Config, TokenData } from './types';

export class OAuth2Manager {
  private accessToken: AccessToken | null = null;
  private refreshPromise: Promise<void> | null = null;
  private readonly storage: FileTokenStorage;
  private readonly oauth2Client: AuthorizationCode;

  constructor(
    serviceName: string,
    private oauth2Config: OAuth2Config,
  ) {
    this.oauth2Client = new AuthorizationCode({
      client: {
        id: oauth2Config.clientId,
        secret: oauth2Config.clientSecret,
      },
      auth: {
        tokenHost: oauth2Config.tokenHost,
        tokenPath: oauth2Config.tokenPath,
      },
      http: {
        json: 'strict',
        headers: {
          'User-Agent': 'TemporalWorker/1.0',
        },
      },
    });
    this.storage = new FileTokenStorage(serviceName, this.oauth2Client);
  }

  async getAccessToken(): Promise<string> {
    await this.ensureTokenLoaded();

    if (!this.accessToken) {
      throw new OAuth2Error('No access token available');
    }

    const isExpired = this.accessToken.expired(
      this.oauth2Config.tokenExpirationWindowSeconds,
    );

    if (isExpired) {
      await this.refreshToken();
    }

    const token = this.accessToken.token;

    if (!token || typeof token.access_token !== 'string') {
      throw new OAuth2Error('Invalid access token format');
    }

    return token.access_token;
  }

  async refreshToken(): Promise<void> {
    if (this.refreshPromise) {
      await this.refreshPromise;

      return;
    }

    this.refreshPromise = this.performRefresh();
    try {
      await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  async clearTokens(): Promise<void> {
    if (this.accessToken) {
      try {
        await this.accessToken.revokeAll();
      } catch (error) {
        // Log error but don't throw - token revocation failure shouldn't prevent clearing
        console.error(
          'Failed to revoke tokens:',
          error instanceof Error ? error.message : String(error),
        );
      }
    }

    this.accessToken = null;
    this.refreshPromise = null;
    await this.storage.clear();
  }

  private async ensureTokenLoaded(): Promise<void> {
    if (this.accessToken) return;

    const tokenData = await this.storage.load();

    if (tokenData) {
      this.accessToken = this.oauth2Client.createToken({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: new Date(tokenData.expires_at),
        token_type: tokenData.token_type,
      });
    }
  }

  private async performRefresh(): Promise<void> {
    if (!this.accessToken) {
      throw new OAuth2Error('No access token to refresh');
    }

    try {
      this.accessToken = await this.accessToken.refresh();
      await this.saveToken();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (message.includes('invalid_grant')) {
        await this.clearTokens();
        throw new OAuth2Error('Invalid refresh token - tokens cleared');
      }

      throw new OAuth2Error(`Failed to refresh token: ${message}`);
    }
  }

  private async saveToken(): Promise<void> {
    if (!this.accessToken) return;

    const token = this.accessToken.token;

    if (!token) {
      throw new OAuth2Error('Invalid token data');
    }

    const tokenData: TokenData = {
      access_token:
        typeof token.access_token === 'string' ? token.access_token : '',
      refresh_token:
        (typeof token.refresh_token === 'string'
          ? token.refresh_token
          : null) || this.oauth2Config.refreshToken,
      expires_at:
        (token.expires_at instanceof Date
          ? token.expires_at.getTime()
          : null) || Date.now() + 3600000,
      token_type:
        (typeof token.token_type === 'string' ? token.token_type : null) ||
        'Bearer',
    };

    await this.storage.save(tokenData);
  }
}
