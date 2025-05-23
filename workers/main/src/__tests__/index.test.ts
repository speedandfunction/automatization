import { describe, expect, it } from 'vitest';
import { vi } from 'vitest';

import * as utils from '../../../common/utils';
import { handleRunError, run } from '../index';

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
    const logSpy = vi
      .spyOn(utils, 'logWorkerError')
      .mockImplementation(() => {});
    const error = new Error('test error');

    expect(() => handleRunError(error)).toThrow(error);
    expect(logSpy).toHaveBeenCalledWith('main', error);
    logSpy.mockRestore();
  });
});
