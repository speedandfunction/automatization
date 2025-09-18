import { describe, expect, it } from 'vitest';

import { getContractTypeByDate } from './FinAppUtils';

describe('getContractTypeByDate', () => {
  it('should return undefined when contractTypeHistory is undefined', () => {
    const result = getContractTypeByDate(undefined, '2024-01-01');

    expect(result).toBeUndefined();
  });

  it('should return undefined when contractTypeHistory is empty', () => {
    const result = getContractTypeByDate({}, '2024-01-01');

    expect(result).toBeUndefined();
  });

  it('should return undefined when input date is invalid', () => {
    const contractTypeHistory = {
      '2024-01-01': 'Full-time',
      '2024-06-01': 'Part-time',
    };
    const result = getContractTypeByDate(contractTypeHistory, 'invalid-date');

    expect(result).toBeUndefined();
  });

  it('should return the correct contract type for a date that matches exactly', () => {
    const contractTypeHistory = {
      '2024-01-01': 'Full-time',
      '2024-06-01': 'Part-time',
    };
    const result = getContractTypeByDate(contractTypeHistory, '2024-01-01');

    expect(result).toBe('Full-time');
  });

  it('should return the most recent contract type for a date between entries', () => {
    const contractTypeHistory = {
      '2024-01-01': 'Full-time',
      '2024-06-01': 'Part-time',
    };
    const result = getContractTypeByDate(contractTypeHistory, '2024-03-15');

    expect(result).toBe('Full-time');
  });

  it('should return the latest contract type for a date after all entries', () => {
    const contractTypeHistory = {
      '2024-01-01': 'Full-time',
      '2024-06-01': 'Part-time',
    };
    const result = getContractTypeByDate(contractTypeHistory, '2024-12-01');

    expect(result).toBe('Part-time');
  });

  it('should handle dates in different formats correctly', () => {
    const contractTypeHistory = {
      '2024-01-01': 'Full-time',
      '2024-06-01': 'Part-time',
    };
    const result = getContractTypeByDate(
      contractTypeHistory,
      '2024-01-01T00:00:00.000Z',
    );

    expect(result).toBe('Full-time');
  });

  it('should filter out invalid dates from contractTypeHistory', () => {
    const contractTypeHistory = {
      '2024-01-01': 'Full-time',
      'definitely-not-a-date': 'Should-be-ignored',
      '2024-06-01': 'Part-time',
    };
    const result = getContractTypeByDate(contractTypeHistory, '2024-03-15');

    expect(result).toBe('Full-time');
  });

  it('should handle multiple invalid dates in contractTypeHistory', () => {
    const contractTypeHistory = {
      'definitely-not-a-date': 'Should-be-ignored-1',
      '2024-01-01': 'Full-time',
      'invalid-date-string': 'Should-be-ignored-2',
      '2024-06-01': 'Part-time',
    };
    const result = getContractTypeByDate(contractTypeHistory, '2024-12-01');

    expect(result).toBe('Part-time');
  });

  it('should return undefined when all dates in contractTypeHistory are invalid', () => {
    const contractTypeHistory = {
      'definitely-not-a-date': 'Should-be-ignored-1',
      'invalid-date-string': 'Should-be-ignored-2',
    };
    const result = getContractTypeByDate(contractTypeHistory, '2024-01-01');

    expect(result).toBeUndefined();
  });

  it('should handle single entry correctly', () => {
    const contractTypeHistory = {
      '2024-01-01': 'Full-time',
    };
    const result = getContractTypeByDate(contractTypeHistory, '2024-06-01');

    expect(result).toBe('Full-time');
  });

  it('should handle date before first entry correctly', () => {
    const contractTypeHistory = {
      '2024-06-01': 'Part-time',
      '2024-12-01': 'Contract',
    };
    const result = getContractTypeByDate(contractTypeHistory, '2024-01-01');

    expect(result).toBeUndefined();
  });

  it('should handle ISO date strings correctly', () => {
    const contractTypeHistory = {
      '2024-01-01T00:00:00.000Z': 'Full-time',
      '2024-06-01T00:00:00.000Z': 'Part-time',
    };
    const result = getContractTypeByDate(
      contractTypeHistory,
      '2024-03-15T00:00:00.000Z',
    );

    expect(result).toBe('Full-time');
  });

  it('should handle edge case with only invalid dates and valid input date', () => {
    const contractTypeHistory = {
      'definitely-not-a-date': 'Invalid-entry-1',
      'invalid-date-string': 'Invalid-entry-2',
    };
    const result = getContractTypeByDate(contractTypeHistory, '2024-01-01');

    expect(result).toBeUndefined();
  });
});
