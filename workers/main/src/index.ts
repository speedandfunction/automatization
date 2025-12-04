import { Client, Connection } from '@temporalio/client';
import { NativeConnection, Worker } from '@temporalio/worker';

import * as activities from './activities';
import { validateEnv } from './common/utils';
import { setupWeeklyReportSchedule } from './configs/schedules';
import { temporalConfig } from './configs/temporal';
import { workerConfig } from './configs/worker';
import { logger } from './logger';

export { logger };

validateEnv();

export async function createConnection() {
  return NativeConnection.connect(temporalConfig);
}

export async function createWorker(connection: NativeConnection) {
  const workerOptions = {
    ...workerConfig,
    connection,
    workflowsPath: require.resolve('./workflows'),
    activities,
  };

  return Worker.create(workerOptions);
}

export async function run(): Promise<void> {
  // Setup weekly report schedule before starting worker
  const clientConnection = await Connection.connect(temporalConfig);

  try {
    const client = new Client({ connection: clientConnection });

    await setupWeeklyReportSchedule(client);
  } catch (err) {
    logger.error(
      `Failed to setup schedule: ${err instanceof Error ? err.message : String(err)}`,
    );
  } finally {
    await clientConnection.close();
  }

  // Create and run worker
  const connection = await createConnection();

  try {
    const worker = await createWorker(connection);

    await worker.run();
  } catch (err) {
    handleRunError(err);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

export function handleRunError(error: unknown): void {
  logger.error(
    `Error in main worker: ${error instanceof Error ? error.message : String(error)}`,
  );
  setTimeout(() => process.exit(1), 100);
}

export function mainEntry() {
  if (require.main === module) {
    run().catch(handleRunError);
  }
}

mainEntry();
