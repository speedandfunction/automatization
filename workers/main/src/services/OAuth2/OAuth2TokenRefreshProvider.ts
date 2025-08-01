import axios from 'axios';

import { OAuth2Error } from '../../common/errors';
import { qboConfig } from '../../configs/qbo';
import { TOKEN_CONFIG } from './constants';
import { TokenRefreshProvider } from './types';
import { TokenData, TokenResponse } from './types';

export class OAuth2TokenRefreshProvider implements TokenRefreshProvider {
  async refreshToken(refreshToken: string): Promise<TokenData> {
    const tokenData = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    };

    const authString = Buffer.from(
      `${qboConfig.clientId}:${qboConfig.clientSecret}`,
    ).toString('base64');

    try {
      const response = await axios.post<TokenResponse>(
        qboConfig.tokenEndpoint,
        new URLSearchParams(tokenData).toString(),
        {
          headers: {
            'Content-Type': TOKEN_CONFIG.CONTENT_TYPE,
            'Authorization': `Basic ${authString}`,
            'Accept': TOKEN_CONFIG.ACCEPT_TYPE,
          },
        },
      );

      return this.mapResponseToTokenData(response.data);
    } catch (error) {
      throw this.handleRefreshError(error);
    }
  }

  private handleRefreshError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const data = error.response?.data as { error?: string } | undefined;

      if (status === 400 && data?.error === 'invalid_grant') {
        return new OAuth2Error(
          'Refresh token is invalid or expired. Please obtain a new refresh token from QuickBooks.',
        );
      }

      if (status === 401) {
        return new OAuth2Error(
          'Invalid client credentials. Please check QBO_CLIENT_ID and QBO_CLIENT_SECRET.',
        );
      }

      if (status === 403) {
        return new OAuth2Error(
          'Access denied. Please check your QuickBooks app permissions.',
        );
      }

      return new OAuth2Error(
        `QBO API error (${status}): ${data?.error || error.message}`,
      );
    }

    return new OAuth2Error(
      `Failed to refresh access token: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  private mapResponseToTokenData(response: TokenResponse): TokenData {
    const expiryTime = new Date();

    expiryTime.setSeconds(
      expiryTime.getSeconds() +
        response.expires_in -
        TOKEN_CONFIG.EXPIRY_BUFFER_SECONDS,
    );

    return {
      access_token: response.access_token,
      refresh_token: response.refresh_token,
      expires_at: expiryTime.getTime(),
      token_type: response.token_type,
    };
  }
}
