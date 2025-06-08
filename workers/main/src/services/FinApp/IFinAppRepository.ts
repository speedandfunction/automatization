import { Employee, Project } from './types';

/**
 * Interface for FinApp repository operations.
 */
export interface IFinAppRepository {
  /**
   * Fetch employees by Redmine user IDs.
   */
  getEmployees(userIds: number[]): Promise<Employee[]>;
  /**
   * Fetch projects by Redmine project IDs.
   */
  getProjects(projectIds: number[]): Promise<Project[]>;
}
