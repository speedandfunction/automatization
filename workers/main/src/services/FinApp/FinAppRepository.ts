import { FinAppRepositoryError } from '../../common/errors';
import { EmployeeModel, ProjectModel } from './FinAppSchemas';
import { IFinAppRepository } from './IFinAppRepository';
import { Employee, Project } from './types';

export class FinAppRepository implements IFinAppRepository {
  async getEmployeesByRedmineIds(redmineIds: number[]): Promise<Employee[]> {
    try {
      return await EmployeeModel.find(
        { redmine_id: { $in: redmineIds } },
        { 'redmine_id': 1, 'history.rate': 1, 'history.contractType': 1 },
      ).lean<Employee[]>();
    } catch (error) {
      throw new FinAppRepositoryError(
        `FinAppRepository.getEmployeesByRedmineIds failed: ${(error as Error).message}`,
      );
    }
  }

  async getProjectsByRedmineIds(redmineIds: number[]): Promise<Project[]> {
    try {
      return await ProjectModel.find(
        { redmine_id: { $in: redmineIds } },
        {
          'name': 1,
          'redmine_id': 1,
          'quick_books_id': 1,
          'history.rate': 1,
          'history.contractType': 1,
        },
      ).lean<Project[]>();
    } catch (error) {
      throw new FinAppRepositoryError(
        `FinAppRepository.getProjectsByRedmineIds failed: ${(error as Error).message}`,
      );
    }
  }
}
