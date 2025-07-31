import { describe, expect, it } from 'vitest';

import { OAuth2Error } from './OAuth2Error';

describe('OAuth2Error', () => {
  it('should set the message and name', () => {
    const err = new OAuth2Error('test message');

    expect(err.message).toBe('test message');
    expect(err.name).toBe('OAuth2Error');
  });
});
