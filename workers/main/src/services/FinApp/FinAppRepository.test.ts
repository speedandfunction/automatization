import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FinAppRepository } from './FinAppRepository';
import { FinAppRepositoryError } from '../../common/errors';
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

  beforeEach(() => {
    repo = new FinAppRepository();
    vi.clearAllMocks();
  });

  describe('getEmployees', () => {
    it('returns employees on success', async () => {
      const employees: Employee[] = [
        { redmine_id: 1, history: { rate: { '2024-01-01': 100 } } },
      ];
      (EmployeeModel.find as any).mockReturnValueOnce({
        lean: vi.fn().mockResolvedValueOnce(employees),
      });
      const result = await repo.getEmployees([1]);
      expect(result).toEqual(employees);
      expect(EmployeeModel.find).toHaveBeenCalledWith(
        { redmine_id: { $in: [1] } },
        { redmine_id: 1, 'history.rate': 1 },
      );
    });

    it('throws FinAppRepositoryError on error', async () => {
      (EmployeeModel.find as any).mockImplementationOnce(() => {
        throw new Error('fail');
      });
      await expect(repo.getEmployees([1])).rejects.toThrow(FinAppRepositoryError);
    });
  });

  describe('getProjects', () => {
    it('returns projects on success', async () => {
      const projects: Project[] = [
        { redmine_id: 2, quick_books_id: 10, history: { rate: { '2024-01-01': 200 } } },
      ];
      (ProjectModel.find as any).mockReturnValueOnce({
        lean: vi.fn().mockResolvedValueOnce(projects),
      });
      const result = await repo.getProjects([2]);
      expect(result).toEqual(projects);
      expect(ProjectModel.find).toHaveBeenCalledWith(
        { redmine_id: { $in: [2] } },
        { redmine_id: 1, quick_books_id: 1, 'history.rate': 1 },
      );
    });

    it('throws FinAppRepositoryError on error', async () => {
      (ProjectModel.find as any).mockImplementationOnce(() => {
        throw new Error('fail');
      });
      await expect(repo.getProjects([2])).rejects.toThrow(FinAppRepositoryError);
    });
  });
}); 