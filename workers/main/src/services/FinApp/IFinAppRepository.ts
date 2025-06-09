import { Employee, Project } from './types';

/**
 * Interface for FinApp repository operations.
 */
export interface IFinAppRepository {
  /**
   * Fetch employees by Redmine user IDs.
   */
  getEmployeesByRedmineIds(userIds: number[]): Promise<Employee[]>;
  /**
   * Fetch projects by Redmine project IDs.
   */
  getProjectsByRedmineIds(projectIds: number[]): Promise<Project[]>;
}
