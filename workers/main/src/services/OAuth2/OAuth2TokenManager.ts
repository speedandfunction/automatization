import { OAuth2Error } from '../../common/errors';
import { ERROR_CODES, ERROR_MESSAGES, TOKEN_CONFIG } from './constants';
import { FileTokenStorage } from './FileTokenStorage';
import { OAuth2TokenRefreshProvider } from './OAuth2TokenRefreshProvider';
import {
  OAuth2TokenManagerInterface,
  TokenRefreshProvider,
  TokenStorageProvider,
} from './types';
import { TokenData } from './types';

export class OAuth2TokenManager implements OAuth2TokenManagerInterface {
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
  }

  private async initializeTokens(): Promise<void> {
    await this.loadTokens();
  }

  async getAccessToken(): Promise<string> {
    await this.initializeTokens();

    if (!this.accessToken) {
      throw new OAuth2Error(ERROR_MESSAGES.NO_ACCESS_TOKEN);
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
    if (!this.accessToken || !this.refreshToken || !this.tokenExpiry) {
      return false;
    }

    if (this.accessToken.length === 0 || this.refreshToken.length === 0) {
      return false;
    }

    return Date.now() < this.tokenExpiry.getTime();
  }

  private async loadTokens(): Promise<void> {
    try {
      const tokenData = await this.storage.load();

      if (tokenData) {
        this.setTokenData(tokenData);
      }
    } catch {
      throw new OAuth2Error(ERROR_MESSAGES.LOAD_TOKENS_FAILED);
    }

    if (!this.refreshToken) {
      this.refreshToken = this.defaultRefreshToken;
    }
  }

  private isValidTokenData(tokenData: TokenData): boolean {
    if (!tokenData) {
      return false;
    }

    if (
      typeof tokenData.access_token !== 'string' ||
      tokenData.access_token.length === 0
    ) {
      return false;
    }

    if (
      typeof tokenData.refresh_token !== 'string' ||
      tokenData.refresh_token.length === 0
    ) {
      return false;
    }

    if (
      typeof tokenData.expires_at !== 'number' ||
      !Number.isFinite(tokenData.expires_at) ||
      tokenData.expires_at <= 0
    ) {
      return false;
    }

    const expiryDate = new Date(tokenData.expires_at);

    if (isNaN(expiryDate.getTime())) {
      return false;
    }

    return true;
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
        error instanceof OAuth2Error &&
        error.code === ERROR_CODES.INVALID_GRANT
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
    } catch {
      throw new OAuth2Error(ERROR_MESSAGES.CLEAR_TOKENS_FAILED);
    }
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
    if (!this.isValidTokenData(tokenData)) {
      throw new OAuth2Error(ERROR_MESSAGES.INVALID_TOKEN_DATA);
    }

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

  setTokenDataForTesting(tokenData: TokenData): void {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error(
        'setTokenDataForTesting can only be used in test environments',
      );
    }

    if (tokenData) {
      this.accessToken = tokenData.access_token;
      this.refreshToken = tokenData.refresh_token;
      this.tokenExpiry = new Date(tokenData.expires_at);
    } else {
      this.accessToken = null;
      this.refreshToken = null;
      this.tokenExpiry = null;
    }
  }
}
