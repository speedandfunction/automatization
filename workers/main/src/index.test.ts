import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { handleRunError, logger } from './index';

describe('handleRunError', () => {
  let processExitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Mock process.exit to prevent actual process termination during tests
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
  });

  afterEach(() => {
    processExitSpy.mockRestore();
  });

  it('should log the error', () => {
    const error = new Error('test error');
    const logSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});

    handleRunError(error);
    expect(logSpy).toHaveBeenCalledWith(
      `Error in main worker: ${error.message}`,
    );
    logSpy.mockRestore();
  });

  it('should log when error is a string', () => {
    const error = 'string error';
    const logSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});

    handleRunError(error);
    expect(logSpy).toHaveBeenCalledWith(`Error in main worker: ${error}`);
    logSpy.mockRestore();
  });

  it('should log when error is an Error object', () => {
    const error = new Error('error from Error object');
    const logSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});

    handleRunError(error);
    expect(logSpy).toHaveBeenCalledWith(
      `Error in main worker: ${error.message}`,
    );
    logSpy.mockRestore();
  });
});
