import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../configs', () => ({
  validationResult: { success: true },
}));

import * as configs from '../configs';
import { validateEnv } from './utils';

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
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
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
