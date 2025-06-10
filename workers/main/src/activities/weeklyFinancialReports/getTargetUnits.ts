import { AppError } from '../../common/errors';
import { writeJsonFile } from '../../common/fileUtils';
import { RedminePool } from '../../common/RedminePool';
import { GroupName } from '../../common/types';
import { redmineDatabaseConfig } from '../../configs/redmineDatabase';
import { TargetUnitRepository } from '../../services/TargetUnit/TargetUnitRepository';

interface GetTargetUnitsResult {
  fileLink: string;
}

export const getTargetUnits = async (
  groupName: GroupName,
): Promise<GetTargetUnitsResult> => {
  const redminePool = new RedminePool(redmineDatabaseConfig);

  try {
    const pool = redminePool.getPool();

    const repo = new TargetUnitRepository(pool);
    const result = await repo.getTargetUnits(groupName);
    const filename = `data/weeklyFinancialReportsWorkflow/getTargetUnits/target-units-${Date.now()}.json`;

    await writeJsonFile(filename, result);

    return { fileLink: filename };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    throw new AppError('Failed to get Target Units', message);
  } finally {
    await redminePool.endPool();
  }
};
