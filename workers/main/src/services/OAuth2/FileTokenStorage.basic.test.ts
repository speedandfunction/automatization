import { promises as fs } from 'fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { OAuth2Error } from '../../common/errors';
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

describe('FileTokenStorage - Basic', () => {
  let fileTokenStorage: FileTokenStorage;
  let mockMkdir: ReturnType<typeof vi.fn>;
  let mockWriteFile: ReturnType<typeof vi.fn>;

  const mockTokenData: TokenData = {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    expires_at: Date.now() + 3600000,
    token_type: 'Bearer',
  };

  beforeEach(() => {
    mockMkdir = vi.mocked(fs.mkdir);
    mockWriteFile = vi.mocked(fs.writeFile);

    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);

    fileTokenStorage = new FileTokenStorage('test-service');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with default service name', () => {
      const storage = new FileTokenStorage();

      expect(storage).toBeInstanceOf(FileTokenStorage);
    });

    it('should create instance with custom service name', () => {
      const storage = new FileTokenStorage('custom-service');

      expect(storage).toBeInstanceOf(FileTokenStorage);
    });

    it('should create instance with custom token file path', () => {
      const customPath = '/custom/path/token.json';
      const storage = new FileTokenStorage('test-service', customPath);

      expect(storage).toBeInstanceOf(FileTokenStorage);
    });
  });

  describe('save', () => {
    it('should save token data successfully', async () => {
      await fileTokenStorage.save(mockTokenData);

      expect(mockMkdir).toHaveBeenCalledWith(expect.any(String), {
        recursive: true,
      });
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.any(String),
        JSON.stringify(mockTokenData, null, 2),
      );
    });

    it('should throw OAuth2Error when save fails', async () => {
      mockWriteFile.mockRejectedValue(new Error('Write failed'));

      await expect(fileTokenStorage.save(mockTokenData)).rejects.toThrow(
        OAuth2Error,
      );
      await expect(fileTokenStorage.save(mockTokenData)).rejects.toThrow(
        'Failed to save token data to file',
      );
    });

    it('should throw OAuth2Error when mkdir fails', async () => {
      mockMkdir.mockRejectedValue(new Error('Mkdir failed'));

      await expect(fileTokenStorage.save(mockTokenData)).rejects.toThrow(
        OAuth2Error,
      );
      await expect(fileTokenStorage.save(mockTokenData)).rejects.toThrow(
        'Failed to save token data to file',
      );
    });
  });
});
