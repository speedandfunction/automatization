import { describe, expect, it } from 'vitest';

import { SlackRepositoryError } from './SlackRepositoryError';

describe('SlackRepositoryError', () => {
  it('should set the message and name', () => {
    const err = new SlackRepositoryError('test message');

    expect(err.message).toBe('test message');
    expect(err.name).toBe('SlackRepositoryError');
  });
});
