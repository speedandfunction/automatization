import { describe, expect, it } from 'vitest';

import { TargetUnitRepositoryError } from './TargetUnitRepositoryError';

describe('TargetUnitRepositoryError', () => {
  it('should set the message and name', () => {
    const err = new TargetUnitRepositoryError('test message');

    expect(err.message).toBe('test message');
    expect(err.name).toBe('TargetUnitRepositoryError');
  });
});
