import { describe, expect, it } from 'vitest';

import { FileUtilsError } from './FileUtilsError';

describe('FileUtilsError', () => {
  it('should set the message and name', () => {
    const err = new FileUtilsError('test message');

    expect(err.message).toBe('test message');
    expect(err.name).toBe('FileUtilsError');
  });
});
