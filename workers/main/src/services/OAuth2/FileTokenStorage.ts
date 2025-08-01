import { promises as fs } from 'fs';
import { readFileSync } from 'fs';
import { join } from 'path';

import { OAuth2Error } from '../../common/errors';
import { TokenStorageProvider } from './types';
import { TokenData } from './types';

export class FileTokenStorage implements TokenStorageProvider {
  private readonly tokenFilePath: string;
  private readonly serviceName: string;

  constructor(serviceName: string = 'qbo', tokenFilePath?: string) {
    this.serviceName = serviceName;
    this.tokenFilePath =
      tokenFilePath ||
      join(process.cwd(), 'data', 'oauth2_tokens', `${serviceName}.json`);
  }

  async save(tokenData: TokenData): Promise<void> {
    try {
      const dir = join(this.tokenFilePath, '..');

      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(
        this.tokenFilePath,
        JSON.stringify(tokenData, null, 2),
      );
    } catch {
      throw new OAuth2Error('Failed to save token data to file');
    }
  }

  load(): TokenData | null {
    try {
      const data = readFileSync(this.tokenFilePath, 'utf8');
      const tokenData = JSON.parse(data) as TokenData;

      if (!this.isValidTokenData(tokenData)) {
        return null;
      }

      return tokenData;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }

      return null;
    }
  }

  async clear(): Promise<void> {
    try {
      await fs.unlink(this.tokenFilePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw new OAuth2Error('Failed to clear token data from file');
      }
    }
  }

  private isValidTokenData(data: unknown): data is TokenData {
    return (
      typeof data === 'object' &&
      data !== null &&
      typeof (data as TokenData).access_token === 'string' &&
      typeof (data as TokenData).refresh_token === 'string' &&
      typeof (data as TokenData).expires_at === 'number' &&
      typeof (data as TokenData).token_type === 'string'
    );
  }
}
