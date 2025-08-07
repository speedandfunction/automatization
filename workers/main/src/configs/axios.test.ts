import { describe, expect, it } from 'vitest';

import { axiosConfig } from './axios';

describe('axiosConfig', () => {
  it('should have required properties', () => {
    expect(axiosConfig).toHaveProperty('timeout');
    expect(axiosConfig).toHaveProperty('maxRetries');
    expect(axiosConfig).toHaveProperty('headers');
  });

  it('should have correct timeout value', () => {
    expect(axiosConfig.timeout).toBe(30000);
  });

  it('should have correct maxRetries value', () => {
    expect(axiosConfig.maxRetries).toBe(3);
  });

  it('should have correct headers', () => {
    expect(axiosConfig.headers).toEqual({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    });
  });

  it('should have Content-Type header', () => {
    expect(axiosConfig.headers['Content-Type']).toBe('application/json');
  });

  it('should have Accept header', () => {
    expect(axiosConfig.headers['Accept']).toBe('application/json');
  });
});
