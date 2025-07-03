import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { TargetUnit } from '../../common/types';
import { TargetUnitService } from './TargetUnitService';

const createTargetUnit = (overrides: Partial<TargetUnit> = {}): TargetUnit => ({
  group_id: 1,
  group_name: 'Group',
  project_id: 2,
  project_name: 'Project',
  user_id: 3,
  username: 'User',
  spent_on: '2024-06-01',
  total_hours: 8,
  ...overrides,
});

const createMockRepo = () => ({
  getTargetUnits: vi.fn(),
});

describe('TargetUnitService', () => {
  let mockRepo: { getTargetUnits: Mock };
  let service: TargetUnitService;

  beforeEach(() => {
    mockRepo = createMockRepo();
    service = new TargetUnitService(mockRepo);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return project units from the repository', async () => {
    const units = [createTargetUnit()];

    mockRepo.getTargetUnits.mockResolvedValueOnce(units);

    const result = await service.getTargetUnits();

    expect(result).toEqual(units);
    expect(mockRepo.getTargetUnits).toHaveBeenCalledTimes(1);
  });
});
