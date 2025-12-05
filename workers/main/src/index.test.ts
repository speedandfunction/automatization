import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { handleRunError } from './index';
import { logger } from './logger';

describe('handleRunError', () => {
  let processExitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Use fake timers to control setTimeout in handleRunError
    vi.useFakeTimers();
    // Mock process.exit to prevent actual process termination during tests
    processExitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation((() => {}) as never);
  });

  afterEach(() => {
    // Run all pending timers before restoring mocks to prevent race condition
    vi.runAllTimers();
    processExitSpy.mockRestore();
    // Restore real timers
    vi.useRealTimers();
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

  it('should call process.exit with code 1 after timeout', () => {
    const error = new Error('test error');
    const logSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});

    handleRunError(error);

    // Process.exit should not be called immediately
    expect(processExitSpy).not.toHaveBeenCalled();

    // Fast-forward time by 100ms
    vi.advanceTimersByTime(100);

    // Now process.exit should have been called
    expect(processExitSpy).toHaveBeenCalledWith(1);

    logSpy.mockRestore();
  });
});
