import { describe, expect, it } from 'vitest';
import { vi } from 'vitest';

import { handleRunError, logger, run } from './index';

vi.mock('@temporalio/worker', () => ({
  DefaultLogger: class {
    error() {}
  },
  NativeConnection: {
    connect: vi.fn().mockResolvedValue({ close: vi.fn() }),
  },
  Worker: {
    create: vi
      .fn()
      .mockResolvedValue({ run: vi.fn().mockResolvedValue(undefined) }),
  },
}));

describe('run', () => {
  it('should return true', async () => {
    await expect(run()).resolves.toBeUndefined();
  });
});

describe('handleRunError', () => {
  it('should log the error and throw the error', () => {
    const error = new Error('test error');
    const logSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});

    expect(() => handleRunError(error)).toThrow(error);
    expect(logSpy).toHaveBeenCalledWith(
      `Error in main worker: ${error.message}`,
    );
    logSpy.mockRestore();
  });
});
