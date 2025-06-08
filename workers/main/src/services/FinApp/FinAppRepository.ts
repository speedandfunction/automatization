import { Document, Model, ProjectionType } from 'mongoose';

import { FinAppRepositoryError } from '../../common/errors';
import { EmployeeModel, ProjectModel } from './FinAppSchemas';
import { IFinAppRepository } from './IFinAppRepository';
import { Employee, Project } from './types';

/**
 * Repository for accessing FinApp employee and project data.
 */
export class FinAppRepository implements IFinAppRepository {
  /**
   * Generic private method to find documents by redmine_id.
   * @param model Mongoose model
   * @param ids Array of redmine IDs
   * @param projection Fields to project
   * @returns Promise resolving to array of documents
   */
  private async _findByIds<T>(
    model: Model<T & Document>,
    ids: number[],
    projection: ProjectionType<T>,
  ): Promise<T[]> {
    try {
      return await model
        .find({ redmine_id: { $in: ids } }, projection)
        .lean<T[]>();
    } catch (error) {
      throw new FinAppRepositoryError(
        `FinAppRepository._findByIds failed: ${(error as Error).message} (ids: ${ids.join(',')})`,
      );
    }
  }
  /**
   * Fetch employees by Redmine user IDs.
   * @param userIds Array of Redmine user IDs
   * @returns Promise resolving to array of Employee objects
   */
  async getEmployees(userIds: number[]): Promise<Employee[]> {
    return this._findByIds<Employee>(EmployeeModel, userIds, {
      'redmine_id': 1,
      'history.rate': 1,
    });
  }

  /**
   * Fetch projects by Redmine project IDs.
   * @param projectIds Array of Redmine project IDs
   * @returns Promise resolving to array of Project objects
   */
  async getProjects(projectIds: number[]): Promise<Project[]> {
    return this._findByIds<Project>(ProjectModel, projectIds, {
      'redmine_id': 1,
      'quick_books_id': 1,
      'history.rate': 1,
    });
  }
}
