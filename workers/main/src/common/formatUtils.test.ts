import { describe, expect, it } from 'vitest';

import { formatCurrency, getRateByDate } from './formatUtils';

describe('formatCurrency', () => {
  it('formats integer values as USD currency', () => {
    expect(formatCurrency(1000)).toBe('$1,000');
    expect(formatCurrency(0)).toBe('$0');
    expect(formatCurrency(1234567)).toBe('$1,234,567');
  });

  it('rounds down decimal values', () => {
    expect(formatCurrency(1234.56)).toBe('$1,235');
    expect(formatCurrency(999.4)).toBe('$999');
  });
});

describe('getRateByDate', () => {
  const history = {
    '2024-01-01': 100,
    '2024-02-01': 200,
    '2024-03-01': 300,
  };

  it('returns undefined if history is undefined', () => {
    expect(getRateByDate(undefined, '2024-01-01')).toBeUndefined();
  });

  it('returns the rate for the exact date', () => {
    expect(getRateByDate(history, '2024-02-01')).toBe(200);
  });

  it('returns the latest rate before the date', () => {
    expect(getRateByDate(history, '2024-02-15')).toBe(200);
    expect(getRateByDate(history, '2024-03-15')).toBe(300);
  });

  it('returns undefined if date is before all history', () => {
    expect(getRateByDate(history, '2023-12-31')).toBeUndefined();
  });
});
