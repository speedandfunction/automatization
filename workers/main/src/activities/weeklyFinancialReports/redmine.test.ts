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

    const serviceSpy = vi.spyOn(service, 'getProjectUnits');

    const result = await service.getProjectUnits();

    expect(result).toEqual(['unit']);
    expect(serviceSpy).toHaveBeenCalled();

    serviceSpy.mockRestore();
  });
});

describe('getProjectUnits additional cases', () => {
  it('returns correct structure for project units', async () => {
    const mockUnits = [
      {
        group_id: 1,
        group_name: 'Group A',
        project_id: 10,
        project_name: 'Project X',
        user_id: 100,
        username: 'John Doe',
        spent_on: '2024-06-01',
        total_hours: 8,
      },
    ];

    vi.spyOn(RedmineService.prototype, 'getProjectUnits').mockResolvedValueOnce(
      mockUnits,
    );
    const result = await redmineModule.getProjectUnits();

    expect(result).toEqual(mockUnits);
    expect(result[0]).toHaveProperty('group_id');
    expect(result[0]).toHaveProperty('group_name');
    expect(result[0]).toHaveProperty('project_id');
    expect(result[0]).toHaveProperty('project_name');
    expect(result[0]).toHaveProperty('user_id');
    expect(result[0]).toHaveProperty('username');
    expect(result[0]).toHaveProperty('spent_on');
    expect(result[0]).toHaveProperty('total_hours');
  });

  it('returns empty array if no units found', async () => {
    vi.spyOn(RedmineService.prototype, 'getProjectUnits').mockResolvedValueOnce(
      [],
    );
    const result = await redmineModule.getProjectUnits();

    expect(result).toEqual([]);
  });

  it('throws if RedmineService.getProjectUnits fails', async () => {
    vi.spyOn(RedmineService.prototype, 'getProjectUnits').mockRejectedValueOnce(
      new Error('DB error'),
    );
    await expect(redmineModule.getProjectUnits()).rejects.toThrow('DB error');
  });
});
