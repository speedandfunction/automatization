import { describe, expect, it } from 'vitest';

import { OAuth2TokenRefreshProvider } from './OAuth2TokenRefreshProvider';

describe('OAuth2TokenRefreshProvider', () => {
  it('should create instance successfully', () => {
    const refreshProvider = new OAuth2TokenRefreshProvider();

    expect(refreshProvider).toBeInstanceOf(OAuth2TokenRefreshProvider);
  });

  it('should have refreshToken method', () => {
    const refreshProvider = new OAuth2TokenRefreshProvider();

    expect(typeof refreshProvider.refreshToken).toBe('function');
  });

  it('should have refreshToken method that returns a promise', () => {
    const refreshProvider = new OAuth2TokenRefreshProvider();
    const result = refreshProvider.refreshToken('test-token');

    expect(result).toBeInstanceOf(Promise);
  });
});
