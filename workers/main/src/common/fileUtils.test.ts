vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
  },
}));

import { promises as fs } from 'fs';
import path from 'path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { FileUtilsError } from './errors';
import { readJsonFile, writeJsonFile } from './fileUtils';

describe('fileUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('readJsonFile', () => {
    test('reads and parses JSON file', async () => {
      vi.mocked(fs.readFile).mockResolvedValueOnce('{"a":1}');
      const result = await readJsonFile<{ a: number }>('test.json');

      expect(result).toEqual({ a: 1 });
      expect(fs.readFile).toHaveBeenCalledWith('test.json', 'utf-8');
    });

    test('throws FileUtilsError for invalid JSON', async () => {
      vi.mocked(fs.readFile).mockResolvedValueOnce('not-json');
      await expect(readJsonFile('bad.json')).rejects.toBeInstanceOf(
        FileUtilsError,
      );
    });

    test('throws FileUtilsError if fs.readFile throws', async () => {
      vi.mocked(fs.readFile).mockRejectedValueOnce(new Error('fail'));
      await expect(readJsonFile('fail.json')).rejects.toBeInstanceOf(
        FileUtilsError,
      );
    });
  });

  describe('writeJsonFile', () => {
    test('writes JSON file and creates directory', async () => {
      vi.mocked(fs.mkdir).mockResolvedValueOnce(undefined);
      vi.mocked(fs.writeFile).mockResolvedValueOnce(undefined);
      const filePath = 'dir/file.json';
      const data = { b: 2 };

      await writeJsonFile(filePath, data);
      expect(fs.mkdir).toHaveBeenCalledWith(path.dirname(filePath), {
        recursive: true,
      });
      expect(fs.writeFile).toHaveBeenCalledWith(
        filePath,
        JSON.stringify(data, null, 2),
        'utf-8',
      );
    });

    test('throws FileUtilsError if fs.mkdir throws', async () => {
      vi.mocked(fs.mkdir).mockRejectedValueOnce(new Error('fail'));
      await expect(writeJsonFile('fail.json', {})).rejects.toBeInstanceOf(
        FileUtilsError,
      );
    });

    test('throws FileUtilsError if fs.writeFile throws', async () => {
      vi.mocked(fs.mkdir).mockResolvedValueOnce(undefined);
      vi.mocked(fs.writeFile).mockRejectedValueOnce(new Error('fail'));
      await expect(writeJsonFile('fail2.json', {})).rejects.toBeInstanceOf(
        FileUtilsError,
      );
    });
  });
});
