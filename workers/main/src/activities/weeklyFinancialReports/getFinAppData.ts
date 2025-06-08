import { AppError } from '../../common/errors';
import { readJsonFile, writeJsonFile } from '../../common/fileUtils';
import { MongoPool } from '../../common/MongoPool';
import { TargetUnit } from '../../common/types';
import { FinAppRepository } from '../../services/FinApp';

interface GetTargetUnitsResult {
  fileLink: string;
}

const getUniqueIds = <T, K extends keyof T>(items: T[], key: K): T[K][] => [
  ...new Set(items.map((item) => item[key])),
];

export const getFinAppData = async (
  fileLink: string,
): Promise<GetTargetUnitsResult> => {
  const mongoPool = MongoPool.getInstance();
  const filename = `data/weeklyFinancialReportsWorkflow/getFinAppData/data-${Date.now()}.json`;

  try {
    await mongoPool.connect();
    const repo = new FinAppRepository();

    const targetUnits = await readJsonFile<TargetUnit[]>(fileLink);
    const employeeIds = getUniqueIds(targetUnits, 'user_id');
    const projectIds = getUniqueIds(targetUnits, 'project_id');

    const [employees, projects] = await Promise.all([
      repo.getEmployees(employeeIds),
      repo.getProjects(projectIds),
    ]);

    await writeJsonFile(filename, { employees, projects });

    return { fileLink: filename };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    throw new AppError('Failed to get Fin App Data', message);
  } finally {
    await mongoPool.disconnect();
  }
};
