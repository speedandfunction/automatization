import { describe, expect, it, vi } from 'vitest';

import * as redmineModule from './redmine';
import { fetchFinancialData } from './redmine';

describe('fetchFinancialData', () => {
  it('returns expected mock data for default period', async () => {
    const data = await fetchFinancialData();

    expect(data).toBeDefined();
    expect(data.period).toBe('current');
    expect(data.contractType).toBe('T&M');
    expect(data.revenue).toBe(120000);
  });

  it('returns expected mock data for custom period', async () => {
    const data = await fetchFinancialData('previous');

    expect(data).toBeDefined();
    expect(data.period).toBe('previous');
  });
});

describe('getProjectUnits', () => {
  it('calls redmineRepo.getProjectUnits', async () => {
    const spy = vi
      .spyOn(redmineModule, 'getProjectUnits')
      .mockResolvedValue([]);

    await redmineModule.getProjectUnits();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
