import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  vi,
} from 'vitest';

import type { ProjectUnit } from '../../common/types';
import { RedmineService } from '../../services/redmine/RedmineService';
import {
  createMockProjectUnit,
  createMockRedmineRepository,
} from './mocks/redmine';
import { createRedmineService, getProjectUnits } from './redmine';

describe('getProjectUnits', () => {
  let service: RedmineService;
  let repo: ReturnType<typeof createMockRedmineRepository>;

  beforeEach(() => {
    repo = createMockRedmineRepository();
    service = new RedmineService(repo);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls RedmineService.getProjectUnits', async () => {
    const spy = vi.spyOn(service, 'getProjectUnits' as const);
    const result = await getProjectUnits(service);

    expect(spy).toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('returns correct structure for project units', async () => {
    const mockUnits: ProjectUnit[] = [createMockProjectUnit()];

    (repo.getProjectUnits as Mock).mockResolvedValueOnce(mockUnits);
    const result = await getProjectUnits(service);

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
    (repo.getProjectUnits as Mock).mockResolvedValueOnce([]);
    const result = await getProjectUnits(service);

    expect(result).toEqual([]);
  });

  it('throws if RedmineService.getProjectUnits fails', async () => {
    const error = new Error('DB error');

    (repo.getProjectUnits as Mock).mockRejectedValueOnce(error);
    await expect(getProjectUnits(service)).rejects.toThrow('DB error');
  });
});

describe('createRedmineService', () => {
  it('creates a RedmineService instance', () => {
    const service = createRedmineService();

    expect(service).toBeInstanceOf(RedmineService);
  });
});
