import { promises as fs } from 'fs';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FileTokenStorage } from './FileTokenStorage';
import { TokenData } from './types';

vi.mock('fs', () => ({
  promises: {
    mkdir: vi.fn(),
    writeFile: vi.fn(),
    readFile: vi.fn(),
    unlink: vi.fn(),
  },
}));

vi.mock('path', () => ({
  join: vi.fn(),
}));

describe('FileTokenStorage - Load', () => {
  let fileTokenStorage: FileTokenStorage;
  let mockJoin: ReturnType<typeof vi.fn>;
  let mockReadFile: ReturnType<typeof vi.fn>;

  const mockTokenData: TokenData = {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    expires_at: Date.now() + 3600000,
    token_type: 'Bearer',
  };

  beforeEach(() => {
    mockJoin = vi.mocked(join);
    mockReadFile = vi.mocked(fs.readFile);

    mockJoin.mockReturnValue('/test/path/token.json');
    mockReadFile.mockResolvedValue(JSON.stringify(mockTokenData));

    fileTokenStorage = new FileTokenStorage('test-service');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('load', () => {
    it('should load valid token data successfully', async () => {
      const result = await fileTokenStorage.load();

      expect(mockReadFile).toHaveBeenCalledWith(
        '/test/path/token.json',
        'utf8',
      );
      expect(result).toEqual(mockTokenData);
    });

    it('should return null when file does not exist', async () => {
      const error = new Error('File not found') as NodeJS.ErrnoException;

      error.code = 'ENOENT';
      mockReadFile.mockRejectedValue(error);

      const result = await fileTokenStorage.load();

      expect(result).toBeNull();
    });

    it('should return null when file read fails with other error', async () => {
      mockReadFile.mockRejectedValue(new Error('Read failed'));

      const result = await fileTokenStorage.load();

      expect(result).toBeNull();
    });

    it('should return null when token data is invalid', async () => {
      const invalidData = { invalid: 'data' };

      mockReadFile.mockResolvedValue(JSON.stringify(invalidData));

      const result = await fileTokenStorage.load();

      expect(result).toBeNull();
    });

    it('should return null when token data has missing fields', async () => {
      const invalidData = {
        refresh_token: 'test-refresh-token',
        expires_at: Date.now() + 3600000,
        token_type: 'Bearer',
      };

      mockReadFile.mockResolvedValue(JSON.stringify(invalidData));

      const result = await fileTokenStorage.load();

      expect(result).toBeNull();
    });

    it('should return null when token data is null', async () => {
      mockReadFile.mockResolvedValue('null');

      const result = await fileTokenStorage.load();

      expect(result).toBeNull();
    });

    it('should return null when token data is not an object', async () => {
      mockReadFile.mockResolvedValue('"string"');

      const result = await fileTokenStorage.load();

      expect(result).toBeNull();
    });
  });
});
