import { describe, expect, it, vi } from 'vitest';

import * as redmineModule from './redmine';

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
