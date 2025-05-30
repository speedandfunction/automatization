import { vi } from 'vitest';

import type { ProjectUnit } from '../../../common/types';
import type { RedmineRepository } from '../../../services/redmine/RedmineRepository';

export function createMockProjectUnit(
  overrides: Partial<ProjectUnit> = {},
): ProjectUnit {
  return {
    group_id: 1,
    group_name: 'Group A',
    project_id: 10,
    project_name: 'Project X',
    user_id: 100,
    username: 'John Doe',
    spent_on: '2024-06-01',
    total_hours: 8,
    ...overrides,
  };
}

export function createMockRedmineRepository(
  units: ProjectUnit[] = [],
  error?: Error,
): RedmineRepository {
  return {
    getProjectUnits: error
      ? vi.fn().mockRejectedValue(error)
      : vi.fn().mockResolvedValue(units),
  } as unknown as RedmineRepository;
}
