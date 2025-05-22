import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { run, handleRunError } from '../index';

describe('run', () => {
  it('should return true', async () => {
    await expect(run()).resolves.toBe(true);
  });
});

// Test for top-level error handling
import * as indexModule from '../index';

describe('handleRunError', () => {
  const originalError = console.error;
  const originalExit = process.exit;

  beforeEach(() => {
    console.error = vi.fn();
    process.exit = vi.fn() as never;
  });

  afterEach(() => {
    console.error = originalError;
    process.exit = originalExit;
  });

  it('should log error and exit on unhandled error', () => {
    const error = new Error('Test error');
    handleRunError(error);
    expect(console.error).toHaveBeenCalledWith('Unhandled error in main:', error);
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});
