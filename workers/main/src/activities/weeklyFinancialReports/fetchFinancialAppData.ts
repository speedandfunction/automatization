import { AppError } from '../../common/errors';
import { readJsonFile, writeJsonFile } from '../../common/fileUtils';
import { MongoPool } from '../../common/MongoPool';
import { TargetUnit } from '../../common/types';
import { FinAppRepository } from '../../services/FinApp';
import { QBORepository } from '../../services/QBO';

interface GetTargetUnitsResult {
  fileLink: string;
}

const getUniqueIds = <T, K extends keyof T>(items: T[], key: K): T[K][] => [
  ...new Set(items.map((item) => item[key])),
];

export const fetchFinancialAppData = async (
  fileLink: string,
): Promise<GetTargetUnitsResult> => {
  const mongoPool = MongoPool.getInstance();
  const filename = `data/weeklyFinancialReportsWorkflow/getFinAppData/data-${Date.now()}.json`;

  try {
    await mongoPool.connect();
    const repo = new FinAppRepository();
    const qboRepo = new QBORepository();

    const targetUnits = await readJsonFile<TargetUnit[]>(fileLink);
    const employeeIds = getUniqueIds(targetUnits, 'user_id');
    const projectIds = getUniqueIds(targetUnits, 'project_id');

    const [employees, projects, effectiveRevenueByCustomerRef] =
      await Promise.all([
        repo.getEmployeesByRedmineIds(employeeIds),
        repo.getProjectsByRedmineIds(projectIds),
        qboRepo.getEffectiveRevenue(),
      ]);

    await writeJsonFile(filename, {
      employees,
      projects: projects.map((project) => ({
        ...project,
        effectiveRevenue: project.quick_books_id
          ? effectiveRevenueByCustomerRef[project.quick_books_id]
              ?.totalAmount || 0
          : 0,
      })),
      effectiveRevenue: effectiveRevenueByCustomerRef,
    });

    return { fileLink: filename };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    throw new AppError('Failed to get Fin App Data', message);
  } finally {
    await mongoPool.disconnect();
  }
};
