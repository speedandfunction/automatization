import { describe, expect, it } from 'vitest';

import { OAuth2Error } from './OAuth2Error';

describe('OAuth2Error', () => {
  it('should set the message, name, and default error code', () => {
    const err = new OAuth2Error('test message');

    expect(err.message).toBe('test message');
    expect(err.name).toBe('OAuth2Error');
    expect(err.code).toBe('UNKNOWN_OAUTH2_ERROR');
  });

  it('should set the message, name, and custom error code', () => {
    const err = new OAuth2Error('test message', 'CUSTOM_ERROR');

    expect(err.message).toBe('test message');
    expect(err.name).toBe('OAuth2Error');
    expect(err.code).toBe('CUSTOM_ERROR');
  });
});
