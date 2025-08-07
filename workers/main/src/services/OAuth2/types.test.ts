import { describe, expect, it } from 'vitest';

import { OAuth2Config, TokenData, TokenStorageProvider } from './types';

describe('TokenData', () => {
  it('should have required properties', () => {
    const tokenData: TokenData = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      expires_at: Date.now() + 3600000,
      token_type: 'Bearer',
    };

    expect(tokenData.access_token).toBe('test-access-token');
    expect(tokenData.refresh_token).toBe('test-refresh-token');
    expect(tokenData.expires_at).toBeGreaterThan(Date.now());
    expect(tokenData.token_type).toBe('Bearer');
  });

  it('should allow different token types', () => {
    const tokenData: TokenData = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      expires_at: Date.now() + 3600000,
      token_type: 'Basic',
    };

    expect(tokenData.token_type).toBe('Basic');
  });

  it('should handle future expiration times', () => {
    const futureTime = Date.now() + 86400000; // 24 hours from now
    const tokenData: TokenData = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      expires_at: futureTime,
      token_type: 'Bearer',
    };

    expect(tokenData.expires_at).toBe(futureTime);
    expect(tokenData.expires_at).toBeGreaterThan(Date.now());
  });
});

describe('TokenStorageProvider', () => {
  it('should define required methods', () => {
    const mockStorage: TokenStorageProvider = {
      save: async () => {},
      load: async () => null,
      clear: async () => {},
    };

    expect(typeof mockStorage.save).toBe('function');
    expect(typeof mockStorage.load).toBe('function');
    expect(typeof mockStorage.clear).toBe('function');
  });

  it('should allow async operations', async () => {
    const mockStorage: TokenStorageProvider = {
      save: async (tokenData: TokenData) => {
        expect(tokenData.access_token).toBe('test-token');
      },
      load: async () => ({
        access_token: 'test-token',
        refresh_token: 'test-refresh',
        expires_at: Date.now(),
        token_type: 'Bearer',
      }),
      clear: async () => {},
    };

    await mockStorage.save({
      access_token: 'test-token',
      refresh_token: 'test-refresh',
      expires_at: Date.now(),
      token_type: 'Bearer',
    });

    const result = await mockStorage.load();

    expect(result).not.toBeNull();
    expect(result?.access_token).toBe('test-token');
  });
});

describe('OAuth2Config', () => {
  it('should have required properties', () => {
    const config: OAuth2Config = {
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      refreshToken: 'test-refresh-token',
      tokenHost: 'https://oauth.example.com',
      tokenPath: '/oauth/token',
      tokenExpirationWindowSeconds: 300,
    };

    expect(config.clientId).toBe('test-client-id');
    expect(config.clientSecret).toBe('test-client-secret');
    expect(config.refreshToken).toBe('test-refresh-token');
    expect(config.tokenHost).toBe('https://oauth.example.com');
    expect(config.tokenPath).toBe('/oauth/token');
    expect(config.tokenExpirationWindowSeconds).toBe(300);
  });

  it('should have optional authorize properties', () => {
    const config: OAuth2Config = {
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      refreshToken: 'test-refresh-token',
      tokenHost: 'https://oauth.example.com',
      tokenPath: '/oauth/token',
      authorizeHost: 'https://auth.example.com',
      authorizePath: '/oauth/authorize',
      tokenExpirationWindowSeconds: 300,
    };

    expect(config.authorizeHost).toBe('https://auth.example.com');
    expect(config.authorizePath).toBe('/oauth/authorize');
  });

  it('should work without optional authorize properties', () => {
    const config: OAuth2Config = {
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      refreshToken: 'test-refresh-token',
      tokenHost: 'https://oauth.example.com',
      tokenPath: '/oauth/token',
      tokenExpirationWindowSeconds: 300,
    };

    expect(config.clientId).toBe('test-client-id');
    expect(config.authorizeHost).toBeUndefined();
    expect(config.authorizePath).toBeUndefined();
  });

  it('should handle different expiration window values', () => {
    const config: OAuth2Config = {
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      refreshToken: 'test-refresh-token',
      tokenHost: 'https://oauth.example.com',
      tokenPath: '/oauth/token',
      tokenExpirationWindowSeconds: 0,
    };

    expect(config.tokenExpirationWindowSeconds).toBe(0);

    const configWithWindow: OAuth2Config = {
      ...config,
      tokenExpirationWindowSeconds: 600,
    };

    expect(configWithWindow.tokenExpirationWindowSeconds).toBe(600);
  });
});
