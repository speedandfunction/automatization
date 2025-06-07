import { describe, expect, it } from 'vitest';

import { FinAppRepositoryError } from './FinAppRepositoryError';

describe('FinAppRepositoryError', () => {
  it('should set the message and name', () => {
    const err = new FinAppRepositoryError('test message');

    expect(err.message).toBe('test message');
    expect(err.name).toBe('FinAppRepositoryError');
  });
});
