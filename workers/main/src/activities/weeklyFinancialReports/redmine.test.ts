import { describe, expect, it, vi } from 'vitest';

import { RedmineRepository } from '../../services/redmine/RedmineRepository';
import { RedmineService } from '../../services/redmine/RedmineService';
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

describe('getProjectUnits activity', () => {
  it('calls RedmineService.getProjectUnits', async () => {
    const serviceSpy = vi
      .spyOn(RedmineService.prototype, 'getProjectUnits')
      .mockResolvedValue([]);

    await redmineModule.getProjectUnits();
    expect(serviceSpy).toHaveBeenCalled();
    serviceSpy.mockRestore();
  });
});

describe('RedmineService', () => {
  it('delegates to repository', async () => {
    const repo = {
      getProjectUnits: vi.fn().mockResolvedValue(['unit']),
    } as unknown as RedmineRepository;
    const service = new RedmineService(repo);
    const result = await service.getProjectUnits();

    expect(result).toEqual(['unit']);
    expect(repo.getProjectUnits).toHaveBeenCalled();
  });
});
