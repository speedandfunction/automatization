import { join } from 'path';
import { AuthorizationCode } from 'simple-oauth2';

import { FileUtilsError } from '../../common/errors';
import {
  deleteJsonFile,
  readJsonFile,
  writeJsonFile,
} from '../../common/fileUtils';
import { TokenData, TokenStorageProvider } from './types';

export class FileTokenStorage implements TokenStorageProvider {
  private readonly tokenFilePath: string;

  constructor(
    serviceName: string = 'qbo',
    private oauth2Client: AuthorizationCode,
  ) {
    this.tokenFilePath = join(
      process.cwd(),
      'data',
      'oauth2_tokens',
      `${serviceName}.json`,
    );
  }

  async save(tokenData: TokenData): Promise<void> {
    try {
      await writeJsonFile(this.tokenFilePath, tokenData);
    } catch (error) {
      throw new FileUtilsError(
        `Failed to save token data to file: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async load(): Promise<TokenData | null> {
    try {
      const tokenData = await readJsonFile<TokenData>(this.tokenFilePath);

      if (!this.isValidTokenData(tokenData)) {
        return null;
      }

      return tokenData;
    } catch {
      return null;
    }
  }

  async clear(): Promise<void> {
    try {
      await deleteJsonFile(this.tokenFilePath);
    } catch (error) {
      throw new FileUtilsError(
        `Failed to clear token data from file: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private isValidTokenData(data: unknown): data is TokenData {
    if (!data || typeof data !== 'object') {
      return false;
    }

    const tokenData = data as Record<string, unknown>;

    try {
      this.oauth2Client.createToken({
        access_token: tokenData.access_token as string,
        refresh_token: tokenData.refresh_token as string,
        expires_at: new Date(tokenData.expires_at as number),
        token_type: tokenData.token_type as string,
      });

      return true;
    } catch {
      return false;
    }
  }
}
