import axios from 'axios';
import path from 'path';

import { qboConfig } from '../../configs/qbo';
import { writeJsonFile, readJsonFile } from '../../common/fileUtils';

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number; // timestamp when token expires
  token_type: string;
}

export class OAuth2TokenManager {
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private refreshToken: string | null = null;
  private readonly tokenFilePath: string;

  constructor() {
    // Используем временную директорию для хранения токенов между activities
    this.tokenFilePath = path.join(process.cwd(), 'temp', 'qbo_tokens.json');
  }

  async getAccessToken(): Promise<string> {
    // Сначала пытаемся загрузить токены из файла
    await this.loadTokensFromFile();

    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    await this.refreshAccessToken();

    if (!this.accessToken) {
      throw new Error('Failed to obtain access token');
    }

    return this.accessToken;
  }

  /**
   * Получить текущий refresh token (для обновления конфигурации)
   */
  async getCurrentRefreshToken(): Promise<string> {
    await this.loadTokensFromFile();
    
    if (this.refreshToken) {
      return this.refreshToken;
    }

    // Если нет сохраненного refresh token, используем из конфигурации
    if (!qboConfig.refreshToken) {
      throw new Error('No refresh token available');
    }

    return qboConfig.refreshToken;
  }

  /**
   * Обновить refresh token в конфигурации (для внешнего использования)
   */
  async updateRefreshTokenInConfig(newRefreshToken: string): Promise<void> {
    this.refreshToken = newRefreshToken;
    await this.saveTokensToFile();
    
    console.log('QBO refresh token updated and saved');
  }

  private async loadTokensFromFile(): Promise<void> {
    try {
      const tokenData: TokenData = await readJsonFile(this.tokenFilePath);
      
      // Проверяем, не истек ли токен
      if (tokenData.expires_at > Date.now()) {
        this.accessToken = tokenData.access_token;
        this.tokenExpiry = new Date(tokenData.expires_at);
        this.refreshToken = tokenData.refresh_token;
        console.log('QBO tokens loaded from file');
      } else {
        console.log('QBO tokens from file are expired, will refresh');
      }
    } catch (error) {
      console.log('No saved QBO tokens found, will use config refresh token');
    }
  }

  private async saveTokensToFile(): Promise<void> {
    if (!this.accessToken || !this.tokenExpiry || !this.refreshToken) {
      return;
    }

    const tokenData: TokenData = {
      access_token: this.accessToken,
      refresh_token: this.refreshToken,
      expires_at: this.tokenExpiry.getTime(),
      token_type: 'Bearer',
    };

    await writeJsonFile(this.tokenFilePath, tokenData);
    console.log('QBO tokens saved to file');
  }

  private async refreshAccessToken(): Promise<void> {
    const currentRefreshToken = await this.getCurrentRefreshToken();

    if (!qboConfig.clientId || !qboConfig.clientSecret) {
      throw new Error('OAuth2 credentials not configured');
    }

    const credentials = Buffer.from(
      `${qboConfig.clientId}:${qboConfig.clientSecret}`,
    ).toString('base64');

    try {
      const response = await axios.post<TokenResponse>(
        qboConfig.tokenUrl,
        'grant_type=refresh_token&refresh_token=' + currentRefreshToken,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${credentials}`,
          },
        },
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = new Date(Date.now() + response.data.expires_in * 1000);
      this.refreshToken = response.data.refresh_token;

      // Сохраняем новые токены в файл
      await this.saveTokensToFile();

      console.log('QBO OAuth2 token refreshed successfully');
      
      // Если refresh token изменился, выводим информацию для обновления конфигурации
      if (response.data.refresh_token !== currentRefreshToken) {
        console.log('⚠️  NEW REFRESH TOKEN RECEIVED - Update QBO_REFRESH_TOKEN environment variable');
        console.log(`New refresh token: ${response.data.refresh_token}`);
      }
    } catch (error) {
      console.error('Failed to refresh QBO OAuth2 token:', error);
      throw new Error(
        `OAuth2 token refresh failed: ${(error as Error).message}`,
      );
    }
  }
}
