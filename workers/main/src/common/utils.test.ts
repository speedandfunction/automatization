import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../configs', () => ({
  validationResult: { success: true },
}));

import * as configs from '../configs';
import { formatDateToISOString, generateJitter, validateEnv } from './utils';

type ValidationResult = {
  success: boolean;
  error?: { issues: { path: unknown[]; message: string }[] };
};
function setValidationResult(result: ValidationResult) {
  (configs as { validationResult: ValidationResult }).validationResult = result;
}

describe('validateEnv', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    }) as unknown as ReturnType<typeof vi.spyOn>;
  });

  afterEach(() => {
    errorSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it('does nothing if validationResult.success is true', () => {
    setValidationResult({ success: true });
    expect(() => validateEnv()).not.toThrow();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('logs error and exits if validationResult.success is false', () => {
    setValidationResult({
      success: false,
      error: {
        issues: [
          { path: ['FOO'], message: 'is required' },
          { path: [], message: 'unknown' },
        ],
      },
    });
    expect(() => validateEnv()).toThrow('exit');
    expect(errorSpy).toHaveBeenCalledWith(
      'Missing or invalid environment variable: FOO (is required)\n' +
      'Missing or invalid environment variable: (unknown variable) (unknown)',
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});

describe('formatDateToISOString', () => {
  it('formats date to ISO string format (YYYY-MM-DD)', () => {
    const testDate = new Date(Date.UTC(2024, 0, 15)); // January 15, 2024 UTC
    const result = formatDateToISOString(testDate);

    expect(result).toBe('2024-01-15');
  });

  it('handles single digit month and day with proper padding', () => {
    const testDate = new Date(Date.UTC(2024, 2, 5)); // March 5, 2024 UTC
    const result = formatDateToISOString(testDate);

    expect(result).toBe('2024-03-05');
  });

  it('handles end of year date', () => {
    const testDate = new Date(Date.UTC(2024, 11, 31)); // December 31, 2024 UTC
    const result = formatDateToISOString(testDate);

    expect(result).toBe('2024-12-31');
  });
});

describe('generateJitter', () => {
  it('generates jitter within expected range', () => {
    const baseDelay = 1000;
    const jitter = generateJitter(baseDelay);

    // Jitter should be between 0 and 10% of baseDelay
    expect(jitter).toBeGreaterThanOrEqual(0);
    expect(jitter).toBeLessThanOrEqual(0.1 * baseDelay);
    expect(jitter).toBeLessThan(100); // 10% of 1000ms
  });

  it('generates different jitter values on multiple calls', () => {
    const baseDelay = 2000;
    const jitter1 = generateJitter(baseDelay);
    const jitter2 = generateJitter(baseDelay);

    // Values should be different (cryptographically random)
    expect(jitter1).not.toBe(jitter2);
  });

  it('scales jitter proportionally with base delay', () => {
    const smallDelay = 500;
    const largeDelay = 2000;

    const smallJitter = generateJitter(smallDelay);
    const largeJitter = generateJitter(largeDelay);

    // Large delay should produce larger jitter
    expect(largeJitter).toBeGreaterThan(smallJitter);

    // Both should be within 10% of their respective base delays
    expect(smallJitter).toBeLessThanOrEqual(0.1 * smallDelay);
    expect(largeJitter).toBeLessThanOrEqual(0.1 * largeDelay);
  });
});
