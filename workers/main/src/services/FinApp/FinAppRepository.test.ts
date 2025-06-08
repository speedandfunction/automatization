import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FinAppRepositoryError } from '../../common/errors';
import { FinAppRepository } from './FinAppRepository';
import { EmployeeModel, ProjectModel } from './FinAppSchemas';
import type { Employee, Project } from './types';

vi.mock('./FinAppSchemas', () => {
  return {
    EmployeeModel: {
      find: vi.fn(),
    },
    ProjectModel: {
      find: vi.fn(),
    },
  };
});

describe('FinAppRepository', () => {
  let repo: FinAppRepository;

  const mockEmployees: Employee[] = [
    { redmine_id: 1, history: { rate: { '2024-01-01': 100 } } },
  ];

  const mockProjects: Project[] = [
    {
      redmine_id: 2,
      quick_books_id: 10,
      history: { rate: { '2024-01-01': 200 } },
    },
  ];

  function mockEmployeeFindSuccess(employees = mockEmployees) {
    vi.mocked(EmployeeModel).find.mockReturnValueOnce({
      lean: vi.fn().mockResolvedValueOnce(employees),
    } as unknown as ReturnType<typeof EmployeeModel.find>);
  }

  function mockEmployeeFindError() {
    vi.mocked(EmployeeModel).find.mockImplementationOnce(() => {
      throw new Error('fail');
    });
  }

  function mockProjectFindSuccess(projects = mockProjects) {
    vi.mocked(ProjectModel).find.mockReturnValueOnce({
      lean: vi.fn().mockResolvedValueOnce(projects),
    } as unknown as ReturnType<typeof ProjectModel.find>);
  }

  function mockProjectFindError() {
    vi.mocked(ProjectModel).find.mockImplementationOnce(() => {
      throw new Error('fail');
    });
  }

  beforeEach(() => {
    repo = new FinAppRepository();
    vi.clearAllMocks();
  });

  describe('getEmployees', () => {
    it('should return employees when EmployeeModel.find resolves', async () => {
      mockEmployeeFindSuccess();
      const result = await repo.getEmployees([1]);

      expect(result).toEqual(mockEmployees);
      expect(vi.mocked(EmployeeModel).find).toHaveBeenCalledWith(
        { redmine_id: { $in: [1] } },
        { 'redmine_id': 1, 'history.rate': 1 },
      );
    });

    it('should throw FinAppRepositoryError when EmployeeModel.find throws', async () => {
      mockEmployeeFindError();
      await expect(repo.getEmployees([1])).rejects.toThrow(
        FinAppRepositoryError,
      );
    });
  });

  describe('getProjects', () => {
    it('should return projects when ProjectModel.find resolves', async () => {
      mockProjectFindSuccess();
      const result = await repo.getProjects([2]);

      expect(result).toEqual(mockProjects);
      expect(vi.mocked(ProjectModel).find).toHaveBeenCalledWith(
        { redmine_id: { $in: [2] } },
        { 'redmine_id': 1, 'quick_books_id': 1, 'history.rate': 1 },
      );
    });

    it('should throw FinAppRepositoryError when ProjectModel.find throws', async () => {
      mockProjectFindError();
      await expect(repo.getProjects([2])).rejects.toThrow(
        FinAppRepositoryError,
      );
    });
  });
});
