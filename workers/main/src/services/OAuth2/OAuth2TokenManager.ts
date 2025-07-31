import { OAuth2Error } from '../../common/errors';
import { ERROR_MESSAGES, TOKEN_CONFIG } from './constants';
import { FileTokenStorage } from './FileTokenStorage';
import {
  IOAuth2TokenManager,
  TokenRefreshProvider,
  TokenStorageProvider,
} from './IOAuth2TokenManager';
import { OAuth2TokenRefreshProvider } from './OAuth2TokenRefreshProvider';
import { TokenData } from './types';

export class OAuth2TokenManager implements IOAuth2TokenManager {
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private refreshToken: string | null = null;
  private refreshPromise: Promise<void> | null = null;

  private readonly storage: TokenStorageProvider;
  private readonly refreshProvider: TokenRefreshProvider;
  private readonly defaultRefreshToken: string;

  constructor(serviceName: string, defaultRefreshToken: string) {
    this.storage = new FileTokenStorage(serviceName);
    this.refreshProvider = new OAuth2TokenRefreshProvider();
    this.defaultRefreshToken = defaultRefreshToken;

    this.loadTokens();
  }

  async getAccessToken(): Promise<string> {
    if (this.isTokenValid()) {
      return this.accessToken!;
    }

    await this.refreshAccessToken();

    if (!this.accessToken) {
      throw new OAuth2Error(ERROR_MESSAGES.NO_ACCESS_TOKEN);
    }

    return this.accessToken;
  }

  getCurrentRefreshToken(): string {
    return this.refreshToken ?? this.defaultRefreshToken;
  }

  isTokenValid(): boolean {
    if (!this.accessToken || !this.tokenExpiry) {
      return false;
    }

    if (this.accessToken.length === 0) {
      return false;
    }

    return Date.now() < this.tokenExpiry.getTime();
  }

  private loadTokens(): void {
    try {
      const tokenData = this.storage.load();

      if (tokenData) {
        this.setTokenData(tokenData);
      }
    } catch {}

    if (!this.refreshToken) {
      this.refreshToken = this.defaultRefreshToken;
    }
  }

  private async refreshAccessToken(): Promise<void> {
    if (this.isWithinRefreshBuffer()) {
      return;
    }

    if (this.refreshPromise) {
      await this.refreshPromise;

      return;
    }

    this.refreshPromise = this.performTokenRefresh();
    try {
      await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<void> {
    const currentRefreshToken = this.getCurrentRefreshToken();

    try {
      const newTokenData =
        await this.refreshProvider.refreshToken(currentRefreshToken);

      this.setTokenData(newTokenData);
      await this.saveTokens();
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('invalid or expired')
      ) {
        await this.clearStoredTokens();
      }
      throw error;
    }
  }

  private async clearStoredTokens(): Promise<void> {
    this.accessToken = null;
    this.tokenExpiry = null;
    this.refreshToken = null;
    this.refreshPromise = null;

    try {
      await this.storage.clear();
    } catch {}
  }

  private isWithinRefreshBuffer(): boolean {
    if (!this.tokenExpiry) {
      return false;
    }

    const bufferTime = TOKEN_CONFIG.TOKEN_BUFFER_MINUTES * 60 * 1000;
    const now = new Date();

    return now.getTime() < this.tokenExpiry.getTime() - bufferTime;
  }

  private setTokenData(tokenData: TokenData): void {
    this.accessToken = tokenData.access_token;
    this.refreshToken = tokenData.refresh_token;
    this.tokenExpiry = new Date(tokenData.expires_at);
  }

  private async saveTokens(): Promise<void> {
    if (!this.accessToken || !this.refreshToken || !this.tokenExpiry) {
      return;
    }

    const tokenData: TokenData = {
      access_token: this.accessToken,
      refresh_token: this.refreshToken,
      expires_at: this.tokenExpiry.getTime(),
      token_type: TOKEN_CONFIG.DEFAULT_TOKEN_TYPE,
    };

    await this.storage.save(tokenData);
  }
}
