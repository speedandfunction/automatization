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

  // Mock data representing a typical Employee document as returned from the database.
  const mockEmployees: Employee[] = [
    {
      redmine_id: 1,
      history: {
        rate: {
          '2017-01-01': 100,
          '2017-07-01': 200,
          '2018-04-01': 300,
        },
      },
      name: 'John Doe',
      sorting: 95,
      updatedAt: new Date('2024-11-26T10:54:02.372Z'),
      email: 'john.dow@lvh.me',
      slack_id: 'U016XUNJWES',
      is_am: false,
      is_pm: false,
      is_pl: false,
    },
  ];

  // Mock data representing a typical Project document as returned from the database.
  const mockProjects: Project[] = [
    {
      redmine_id: 550,
      quick_books_id: undefined,
      history: {
        rate: {
          '2019-10-01': 75,
          '2020-06-01': 100,
        },
      },
      name: 'Example Project',
      sorting: 0,
      is_hidden: false,
      rg_project_id: 0,
      createdAt: new Date('2019-10-28T12:24:14.146Z'),
      updatedAt: new Date('2021-01-14T14:56:00.807Z'),
      migrationVersion: 10,
      firstWorkingDay: new Date('2019-10-21T00:00:00.000Z'),
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
      const result = await repo.getEmployeesByRedmineIds([1]);

      expect(result).toEqual(mockEmployees);
      expect(vi.mocked(EmployeeModel).find).toHaveBeenCalledWith(
        { redmine_id: { $in: [1] } },
        { 'redmine_id': 1, 'history.rate': 1 },
      );
    });

    it('should throw FinAppRepositoryError when EmployeeModel.find throws', async () => {
      mockEmployeeFindError();
      await expect(repo.getEmployeesByRedmineIds([1])).rejects.toThrow(
        FinAppRepositoryError,
      );
    });
  });

  describe('getProjects', () => {
    it('should return projects when ProjectModel.find resolves', async () => {
      mockProjectFindSuccess();
      const result = await repo.getProjectsByRedmineIds([550]);

      expect(result).toEqual(mockProjects);
      expect(vi.mocked(ProjectModel).find).toHaveBeenCalledWith(
        { redmine_id: { $in: [550] } },
        { 'name': 1, 'redmine_id': 1, 'quick_books_id': 1, 'history.rate': 1 },
      );
    });

    it('should throw FinAppRepositoryError when ProjectModel.find throws', async () => {
      mockProjectFindError();
      await expect(repo.getProjectsByRedmineIds([550])).rejects.toThrow(
        FinAppRepositoryError,
      );
    });
  });
});
