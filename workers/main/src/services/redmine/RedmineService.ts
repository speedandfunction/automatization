import { IRedmineRepository } from './IRedmineRepository';

export class RedmineService {
  constructor(private repo: IRedmineRepository) {}

  async getProjectUnits() {
    return this.repo.getProjectUnits();
  }
}
