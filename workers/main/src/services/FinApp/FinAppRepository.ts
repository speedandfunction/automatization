import { FinAppRepositoryError } from '../../common/errors';
import { EmployeeModel, ProjectModel } from './FinAppSchemas';
import { IFinAppRepository } from './IFinAppRepository';
import { Employee, Project } from './types';

export class FinAppRepository implements IFinAppRepository {
  async getEmployees(userIds: number[]): Promise<Employee[]> {
    try {
      return await EmployeeModel.find(
        { redmine_id: { $in: userIds } },
        { 'redmine_id': 1, 'history.rate': 1 },
      ).lean<Employee[]>();
    } catch (error) {
      throw new FinAppRepositoryError(
        `FinAppRepository.getEmployees failed: ${(error as Error).message}`,
      );
    }
  }

  async getProjects(projectIds: number[]): Promise<Project[]> {
    try {
      return await ProjectModel.find(
        { redmine_id: { $in: projectIds } },
        { 'redmine_id': 1, 'quick_books_id': 1, 'history.rate': 1 },
      ).lean<Project[]>();
    } catch (error) {
      throw new FinAppRepositoryError(
        `FinAppRepository.getProjects failed: ${(error as Error).message}`,
      );
    }
  }
}
