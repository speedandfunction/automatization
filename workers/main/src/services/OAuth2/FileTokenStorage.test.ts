import { AuthorizationCode } from 'simple-oauth2';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FileUtilsError } from '../../common/errors';
import * as fileUtils from '../../common/fileUtils';
import { FileTokenStorage } from './FileTokenStorage';
import { TokenData } from './types';

vi.mock('../../common/fileUtils');
vi.mock('simple-oauth2');

describe('FileTokenStorage', () => {
  let fileTokenStorage: FileTokenStorage;
  let mockOAuth2Client: AuthorizationCode;
  let mockCreateToken: ReturnType<typeof vi.fn>;

  const mockTokenData: TokenData = {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    expires_at: Date.now() + 3600000,
    token_type: 'Bearer',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockCreateToken = vi.fn().mockReturnValue({
      token: mockTokenData,
    });

    mockOAuth2Client = {
      createToken: mockCreateToken,
    } as unknown as AuthorizationCode;

    fileTokenStorage = new FileTokenStorage('test-service', mockOAuth2Client);
  });

  describe('constructor', () => {
    it('should create instance with default service name', () => {
      const storage = new FileTokenStorage(undefined, mockOAuth2Client);

      expect(storage).toBeInstanceOf(FileTokenStorage);
    });

    it('should create instance with custom service name', () => {
      const storage = new FileTokenStorage('custom-service', mockOAuth2Client);

      expect(storage).toBeInstanceOf(FileTokenStorage);
    });
  });

  describe('save', () => {
    it('should save token data successfully', async () => {
      const writeJsonFileSpy = vi
        .spyOn(fileUtils, 'writeJsonFile')
        .mockResolvedValue();

      await fileTokenStorage.save(mockTokenData);

      expect(writeJsonFileSpy).toHaveBeenCalledWith(
        expect.stringContaining('test-service.json'),
        mockTokenData,
      );
    });

    it('should throw FileUtilsError when save fails', async () => {
      const error = new Error('Write failed');

      vi.spyOn(fileUtils, 'writeJsonFile').mockRejectedValue(error);

      await expect(fileTokenStorage.save(mockTokenData)).rejects.toThrow(
        FileUtilsError,
      );
    });

    it('should handle non-Error exceptions', async () => {
      vi.spyOn(fileUtils, 'writeJsonFile').mockRejectedValue('String error');

      await expect(fileTokenStorage.save(mockTokenData)).rejects.toThrow(
        FileUtilsError,
      );
    });
  });

  describe('load', () => {
    it('should load valid token data successfully', async () => {
      vi.spyOn(fileUtils, 'readJsonFile').mockResolvedValue(mockTokenData);

      const result = await fileTokenStorage.load();

      expect(result).toEqual(mockTokenData);
      expect(mockCreateToken).toHaveBeenCalledWith({
        access_token: mockTokenData.access_token,
        refresh_token: mockTokenData.refresh_token,
        expires_at: new Date(mockTokenData.expires_at),
        token_type: mockTokenData.token_type,
      });
    });

    it('should return null when file does not exist', async () => {
      vi.spyOn(fileUtils, 'readJsonFile').mockRejectedValue(
        new Error('File not found'),
      );

      const result = await fileTokenStorage.load();

      expect(result).toBeNull();
    });

    it('should return null when token data is invalid', async () => {
      const invalidTokenData = { invalid: 'data' };

      vi.spyOn(fileUtils, 'readJsonFile').mockResolvedValue(invalidTokenData);
      mockCreateToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await fileTokenStorage.load();

      expect(result).toBeNull();
    });

    it('should return null when token data is null', async () => {
      vi.spyOn(fileUtils, 'readJsonFile').mockResolvedValue(null);

      const result = await fileTokenStorage.load();

      expect(result).toBeNull();
    });

    it('should return null when token data is not an object', async () => {
      vi.spyOn(fileUtils, 'readJsonFile').mockResolvedValue('string data');

      const result = await fileTokenStorage.load();

      expect(result).toBeNull();
    });

    it('should return null when token data is empty object', async () => {
      vi.spyOn(fileUtils, 'readJsonFile').mockResolvedValue({});
      mockCreateToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await fileTokenStorage.load();

      expect(result).toBeNull();
    });
  });

  describe('clear', () => {
    it('should clear token data successfully', async () => {
      const deleteJsonFileSpy = vi
        .spyOn(fileUtils, 'deleteJsonFile')
        .mockResolvedValue();

      await fileTokenStorage.clear();

      expect(deleteJsonFileSpy).toHaveBeenCalledWith(
        expect.stringContaining('test-service.json'),
      );
    });

    it('should throw FileUtilsError when clear fails', async () => {
      const error = new Error('Delete failed');

      vi.spyOn(fileUtils, 'deleteJsonFile').mockRejectedValue(error);

      await expect(fileTokenStorage.clear()).rejects.toThrow(FileUtilsError);
    });

    it('should handle non-Error exceptions in clear', async () => {
      vi.spyOn(fileUtils, 'deleteJsonFile').mockRejectedValue('String error');

      await expect(fileTokenStorage.clear()).rejects.toThrow(FileUtilsError);
    });
  });

  describe('isValidTokenData', () => {
    it('should validate correct token data structure', async () => {
      vi.spyOn(fileUtils, 'readJsonFile').mockResolvedValue(mockTokenData);

      const result = await fileTokenStorage.load();

      expect(result).toEqual(mockTokenData);
    });

    it('should reject token data with missing access_token', async () => {
      const invalidTokenData = {
        refresh_token: 'test-refresh-token',
        expires_at: Date.now() + 3600000,
        token_type: 'Bearer',
      };

      vi.spyOn(fileUtils, 'readJsonFile').mockResolvedValue(invalidTokenData);
      mockCreateToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await fileTokenStorage.load();

      expect(result).toBeNull();
    });

    it('should reject token data with missing refresh_token', async () => {
      const invalidTokenData = {
        access_token: 'test-access-token',
        expires_at: Date.now() + 3600000,
        token_type: 'Bearer',
      };

      vi.spyOn(fileUtils, 'readJsonFile').mockResolvedValue(invalidTokenData);
      mockCreateToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await fileTokenStorage.load();

      expect(result).toBeNull();
    });
  });
});
