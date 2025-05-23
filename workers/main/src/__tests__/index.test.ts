import { describe, expect, it } from 'vitest';
import { vi } from 'vitest';

import { handleRunError, logger, run } from '../index';

describe('run', () => {
  it('should return true', async () => {
    await expect(run()).resolves.toBe(true);
  });
});

describe('handleRunError', () => {
  it('should log error and exit process', () => {
    vi.useFakeTimers();
    const error = new Error('test error');
    const loggerErrorSpy = vi
      .spyOn(logger, 'error')
      .mockImplementation(() => {});
    const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });

    expect(() => handleRunError(error)).toThrow(error);
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      `Unhandled error in main: ${error.message}`,
    );
    expect(processExitSpy).not.toHaveBeenCalled();
    expect(() => {
      vi.runAllTimers();
    }).toThrow('exit');
    expect(processExitSpy).toHaveBeenCalledWith(1);

    loggerErrorSpy.mockRestore();
    processExitSpy.mockRestore();
    vi.useRealTimers();
  });
});
