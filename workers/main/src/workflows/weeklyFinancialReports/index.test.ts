import { describe, expect, it, vi } from 'vitest';

import { weeklyFinancialReportsWorkflow } from '..';

describe('weeklyFinancialReportsWorkflow', () => {
  it('should return the report string with default parameters', async () => {
    const result = await weeklyFinancialReportsWorkflow();

    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should return the report string for a custom period', async () => {
    const result = await weeklyFinancialReportsWorkflow({
      period: 'Q1 2025',
    });

    expect(result.startsWith('Weekly Financial Report')).toBe(true);
    expect(result).toContain('Period: Q1 2025');
  });

  it('should log and rethrow errors', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const originalToLocaleString = Number.prototype.toLocaleString.bind(
      Number.prototype,
    );

    Number.prototype.toLocaleString = () => {
      throw new Error('Test error');
    };

    await expect(weeklyFinancialReportsWorkflow()).rejects.toThrow(
      'Test error',
    );
    expect(errorSpy).toHaveBeenCalledWith(
      'Weekly Financial Reports',
      expect.any(Error),
    );

    Number.prototype.toLocaleString = originalToLocaleString;
    errorSpy.mockRestore();
  });
});
