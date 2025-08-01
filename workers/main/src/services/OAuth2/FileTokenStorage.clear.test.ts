import { promises as fs } from 'fs';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { OAuth2Error } from '../../common/errors';
import { FileTokenStorage } from './FileTokenStorage';

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

describe('FileTokenStorage - Clear', () => {
  let fileTokenStorage: FileTokenStorage;
  let mockJoin: ReturnType<typeof vi.fn>;
  let mockUnlink: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockJoin = vi.mocked(join);
    mockUnlink = vi.mocked(fs.unlink);

    mockJoin.mockReturnValue('/test/path/token.json');
    mockUnlink.mockResolvedValue(undefined);

    fileTokenStorage = new FileTokenStorage('test-service');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('clear', () => {
    it('should clear token data successfully', async () => {
      await fileTokenStorage.clear();

      expect(mockUnlink).toHaveBeenCalledWith('/test/path/token.json');
    });

    it('should not throw error when file does not exist', async () => {
      const error = new Error('File not found') as NodeJS.ErrnoException;

      error.code = 'ENOENT';
      mockUnlink.mockRejectedValue(error);

      await expect(fileTokenStorage.clear()).resolves.toBeUndefined();
    });

    it('should throw OAuth2Error when clear fails with other error', async () => {
      mockUnlink.mockRejectedValue(new Error('Delete failed'));

      await expect(fileTokenStorage.clear()).rejects.toThrow(OAuth2Error);
      await expect(fileTokenStorage.clear()).rejects.toThrow(
        'Failed to clear token data from file',
      );
    });
  });
});
