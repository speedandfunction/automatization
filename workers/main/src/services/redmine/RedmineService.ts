import { ProjectUnit } from '../../common/types';
import { IRedmineRepository } from './IRedmineRepository';

export class RedmineService {
  constructor(private repo: IRedmineRepository) {}

  async getProjectUnits(): Promise<ProjectUnit[]> {
    return this.repo.getProjectUnits();
  }
}
