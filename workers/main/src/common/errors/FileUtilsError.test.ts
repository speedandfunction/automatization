import { describe, expect, it } from 'vitest';

import { FileUtilsError } from './FileUtilsError';

describe('FileUtilsError', () => {
  it('should set the message and name', () => {
    const err = new FileUtilsError('test message');

    expect(err.message).toBe('test message');
    expect(err.name).toBe('FileUtilsError');
  });

  it('should set the cause if provided', () => {
    const cause = new Error('root cause');
    const err = new FileUtilsError('with cause', cause);

    expect(err.cause).toBe(cause);
  });

  it('should not set cause if not provided', () => {
    const err = new FileUtilsError('no cause');

    expect(err.cause).toBeUndefined();
  });
});
