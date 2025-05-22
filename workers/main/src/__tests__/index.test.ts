import { describe, expect, it } from 'vitest';
import { vi } from 'vitest';

import { handleRunError, run } from '../index';

describe('run', () => {
  it('should return true', async () => {
    await expect(run()).resolves.toBe(true);
  });
});

describe('handleRunError', () => {
  it('should log error and exit process', () => {
    const error = new Error('test error');
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });

    expect(() => handleRunError(error)).toThrow('exit');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Unhandled error in main:',
      error,
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);

    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });
});
