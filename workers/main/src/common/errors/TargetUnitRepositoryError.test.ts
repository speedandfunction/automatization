import { describe, expect, it } from 'vitest';

import { TargetUnitRepositoryError } from './TargetUnitRepositoryError';

describe('TargetUnitRepositoryError', () => {
  it('should set the message and name', () => {
    const err = new TargetUnitRepositoryError('test message');

    expect(err.message).toBe('test message');
    expect(err.name).toBe('TargetUnitRepositoryError');
  });

  it('should set the cause if provided', () => {
    const cause = new Error('root cause');
    const err = new TargetUnitRepositoryError('with cause', cause);

    expect(err.cause).toBe(cause);
  });

  it('should not set cause if not provided', () => {
    const err = new TargetUnitRepositoryError('no cause');

    expect(err.cause).toBeUndefined();
  });
});
