import { describe, expect, it } from 'vitest';

import { QuickBooksRepositoryError } from './QuickBooksRepositoryError';

describe('QuickBooksRepositoryError', () => {
  it('should set the message and name', () => {
    const err = new QuickBooksRepositoryError('test message');

    expect(err.message).toBe('test message');
    expect(err.name).toBe('QuickBooksRepositoryError');
  });
});
