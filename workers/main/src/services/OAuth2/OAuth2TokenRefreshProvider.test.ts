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
});
